import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

/**
 * §12 Access-request intake — the ONLY on-demand route on the site.
 *
 * Pipeline: bot screen (honeypot + Cloudflare Turnstile) → validate → persist to
 * Supabase `access_requests` (Sydney, AU data residency) → best-effort Resend
 * emails (requester confirmation + team alert). Email failures never fail the
 * request: once the lead is saved we report success and log the email miss.
 *
 * Credentials come from the workerd `cloudflare:workers` env (wrangler vars +
 * secrets / local .dev.vars) — nothing is inlined into the client bundle. The
 * service-role key bypasses RLS (the table has none granting anon inserts), so
 * the insert MUST be server-side; the browser never touches Supabase.
 */
export const prerender = false;

/** Cap field sizes so a hostile payload can't bloat the row or an email. */
const LIMITS = {
  name: 200,
  email: 320,
  interest: 40,
  clinic: 200,
  discipline: 120,
  message: 5000,
  locale: 12,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INTERESTS = new Set(["practice", "practitioner", "personal"]);
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RESEND_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "Lumii <hello@mail.lumii.com.au>";
const REPLY_TO = "support@lumii.com.au";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Parse JSON (fetch path) or form-encoded (no-JS fallback) into a flat record. */
async function readBody(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    return (await request.json().catch(() => ({}))) as Record<string, unknown>;
  }
  const form = await request.formData().catch(() => null);
  if (!form) return {};
  return Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
}

async function verifyTurnstile(
  secret: string,
  token: string,
  ip: string | null,
): Promise<boolean> {
  if (!token) return false;
  const params = new URLSearchParams({ secret, response: token });
  if (ip) params.set("remoteip", ip);
  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: params,
    });
    const outcome = (await res.json()) as { success?: boolean };
    return outcome.success === true;
  } catch {
    return false;
  }
}

interface Lead {
  name: string;
  email: string;
  interest: string;
  clinic: string;
  discipline: string;
  message: string;
  locale: string;
}

async function sendEmails(lead: Lead): Promise<void> {
  const from = env.RESEND_FROM || DEFAULT_FROM;
  const team = env.TEAM_NOTIFY_EMAIL || REPLY_TO;
  const headers = {
    authorization: `Bearer ${env.RESEND_API_KEY}`,
    "content-type": "application/json",
  };

  const confirmation = {
    from,
    to: [lead.email],
    reply_to: REPLY_TO,
    subject: "We've got your Lumii access request",
    text: `Hi ${lead.name},

Thanks for joining Lumii early access. We've received your details and will be in touch as access opens for the experience you're interested in.

If you need to add anything, just reply to this email.

— The Lumii team
${REPLY_TO}`,
  };

  const detail = [
    `Name:       ${lead.name}`,
    `Email:      ${lead.email}`,
    `Interest:   ${lead.interest || "—"}`,
    `Clinic:     ${lead.clinic || "—"}`,
    `Discipline: ${lead.discipline || "—"}`,
    `Locale:     ${lead.locale}`,
    "",
    "Message:",
    lead.message || "—",
  ].join("\n");

  const alert = {
    from,
    to: [team],
    reply_to: lead.email,
    subject: `New access request — ${lead.name}${lead.clinic ? ` (${lead.clinic})` : ""}`,
    text: detail,
  };

  // Best-effort, parallel. A rejected send is logged, not surfaced.
  const results = await Promise.allSettled(
    [confirmation, alert].map((payload) =>
      fetch(RESEND_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }).then(async (r) => {
        if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
      }),
    ),
  );
  for (const r of results) {
    if (r.status === "rejected") {
      console.error("[access-request] email send failed:", r.reason);
    }
  }
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[access-request] missing Supabase config in worker env");
    return json({ ok: false, error: "server" }, 500);
  }

  const body = await readBody(request);

  // Honeypot: a real user never fills a hidden field. Pretend success and drop.
  if (clean(body.company_website, 100) !== "") {
    return json({ ok: true });
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? clientAddress ?? null;

  const token = clean(body["cf-turnstile-response"] ?? body.turnstileToken, 4096);
  if (env.TURNSTILE_SECRET_KEY) {
    const ok = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, token, ip);
    if (!ok) return json({ ok: false, error: "verification" }, 400);
  }

  const lead: Lead = {
    name: clean(body.name, LIMITS.name),
    email: clean(body.email, LIMITS.email).toLowerCase(),
    interest: clean(body.interest, LIMITS.interest),
    clinic: clean(body.clinic, LIMITS.clinic),
    discipline: clean(body.discipline, LIMITS.discipline),
    message: clean(body.message, LIMITS.message),
    locale: clean(body.locale, LIMITS.locale) || "en-AU",
  };

  if (
    !lead.name ||
    !lead.email ||
    !EMAIL_RE.test(lead.email) ||
    !INTERESTS.has(lead.interest)
  ) {
    return json({ ok: false, error: "invalid" }, 400);
  }

  const storedMessage = [
    lead.interest ? `Early-access interest: ${lead.interest}` : "",
    lead.message,
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, LIMITS.message);

  const insert = await fetch(`${env.SUPABASE_URL}/rest/v1/access_requests`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
      prefer: "return=minimal",
    },
    body: JSON.stringify({
      name: lead.name,
      email: lead.email,
      clinic: lead.clinic || null,
      discipline: lead.discipline || null,
      message: storedMessage || null,
      locale: lead.locale,
      source: "website:request-access",
    }),
  });

  if (!insert.ok) {
    console.error(
      "[access-request] supabase insert failed:",
      insert.status,
      await insert.text().catch(() => ""),
    );
    return json({ ok: false, error: "save" }, 502);
  }

  if (env.RESEND_API_KEY) {
    await sendEmails(lead);
  }

  return json({ ok: true });
};

/** Any non-POST method is a 405 (Astro routes POST to the handler above). */
export const ALL: APIRoute = () => json({ ok: false, error: "method" }, 405);
