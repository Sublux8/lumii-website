/**
 * §5 Content model. Collections are the data layer that DRIVES the site — the
 * `sectors` collection generates both the "Who it's for" nav and each audience
 * landing page automatically, so adding a sector is a content edit, never a code
 * change. `status` gates visibility:
 *   - "published" → live, in nav, indexed.
 *   - "draft"     → built but noindex, reachable by direct URL for review.
 *   - "reserved"  → schema-valid placeholder; NOT routed, NOT in nav. Lets us
 *                   commit the future surface's shape now and light it up later.
 *
 * Editable later via Sveltia CMS (drafts branch only — main is protected).
 */
import { defineCollection, reference } from "astro:content";
import { z } from "astro:schema";
import { glob } from "astro/loaders";

const publishStatus = z.enum(["published", "draft", "reserved"]).default("draft");

const sectors = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/sectors" }),
  schema: z.object({
    /** Discipline / audience this sector serves, e.g. "Allied Health". */
    audience: z.string(),
    /** Short label for nav + cards. */
    navLabel: z.string(),
    status: publishStatus,
    /** Nav + landing ordering, ascending. */
    order: z.number().default(100),
    /** One-line summary for cards and meta description fallback. */
    summary: z.string(),
    hero: z.object({
      eyebrow: z.string().optional(),
      headline: z.string(),
      subhead: z.string(),
    }),
    valueProps: z
      .array(
        z.object({
          title: z.string(),
          body: z.string(),
          /** Token name for an icon/illustration slot (rendered by the component). */
          icon: z.string().optional(),
        }),
      )
      .default([]),
    /** Platform modules most relevant to this audience (drives a feature grid). */
    modules: z.array(z.object({ name: z.string(), description: z.string() })).default([]),
    /** Funding bodies / regulatory frames this audience cares about. */
    complianceNotes: z.array(z.string()).default([]),
    cta: z
      .object({ label: z.string(), href: z.string().optional() })
      .default({ label: "Request access" }),
    seo: z
      .object({ title: z.string().optional(), description: z.string().optional() })
      .optional(),
  }),
});

/**
 * Knowledge hub. Taxonomy is intentionally NOT clinician-only — `audience`
 * spans practitioners, owners, patients, and (future) researchers / public, so
 * the hub can grow past a clinical blog without a schema migration.
 */
const knowledge = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/knowledge" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    status: publishStatus,
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    audience: z
      .array(z.enum(["clinician", "practice-owner", "patient", "researcher", "public"]))
      .default(["clinician"]),
    topic: z.enum([
      "getting-started",
      "billing-claiming",
      "compliance",
      "telehealth",
      "care-plans",
      "growth",
      "product-updates",
    ]),
    /** Cross-links to the sectors this article is most relevant to. */
    relatedSectors: z.array(reference("sectors")).default([]),
    author: z.string().default("The Lumii team"),
    readingMinutes: z.number().optional(),
  }),
});

export const collections = { sectors, knowledge };
