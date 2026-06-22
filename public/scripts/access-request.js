/*
 * §12 Access-request form enhancement. External same-origin file so it runs under
 * `script-src 'self'` — no inline allowance needed. Progressive: the markup is a
 * real <form>; this intercepts submit, attaches the Turnstile token, POSTs JSON
 * to the same-origin endpoint, and swaps in a success/error message. All user
 * copy comes from data-* attributes (set from the i18n catalogue) — nothing is
 * hardcoded here.
 */
(function () {
  var form = document.querySelector('[data-form="access-request"]');
  if (!form) return;

  var status = form.querySelector("[data-form-status]");
  var submit = form.querySelector("[data-form-submit]");
  var submitLabel = submit ? submit.textContent : "";

  var copy = {
    submitting: form.getAttribute("data-copy-submitting") || "",
    successTitle: form.getAttribute("data-copy-success-title") || "",
    successBody: form.getAttribute("data-copy-success") || "",
    error: form.getAttribute("data-copy-error") || "",
    challenge: form.getAttribute("data-copy-challenge") || "",
  };

  function showStatus(message, tone) {
    if (!status) return;
    status.textContent = message;
    status.setAttribute("data-tone", tone);
    status.hidden = false;
  }

  function setBusy(busy) {
    if (!submit) return;
    submit.disabled = busy;
    submit.setAttribute("aria-busy", busy ? "true" : "false");
    submit.textContent = busy ? copy.submitting || submitLabel : submitLabel;
  }

  function resetChallenge() {
    if (window.turnstile && typeof window.turnstile.reset === "function") {
      try {
        window.turnstile.reset();
      } catch (e) {
        /* widget not ready — ignore */
      }
    }
  }

  function succeed() {
    var panel = document.createElement("div");
    panel.className = "form-success";
    panel.setAttribute("role", "status");
    var heading = document.createElement("p");
    heading.className = "form-success__title";
    heading.textContent = copy.successTitle;
    var body = document.createElement("p");
    body.className = "form-success__body";
    body.textContent = copy.successBody;
    panel.appendChild(heading);
    panel.appendChild(body);
    form.replaceWith(panel);
    panel.focus && panel.focus();
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (status) status.hidden = true;

    var fd = new FormData(form);
    var token = fd.get("cf-turnstile-response");
    if (!token) {
      showStatus(copy.challenge || copy.error, "error");
      resetChallenge();
      return;
    }

    var payload = {
      name: fd.get("name") || "",
      email: fd.get("email") || "",
      clinic: fd.get("clinic") || "",
      discipline: fd.get("discipline") || "",
      message: fd.get("message") || "",
      locale: fd.get("locale") || "",
      company_website: fd.get("company_website") || "",
      "cf-turnstile-response": token,
    };

    setBusy(true);

    fetch(form.getAttribute("action") || "/api/access-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res
          .json()
          .catch(function () {
            return { ok: false };
          })
          .then(function (data) {
            return { ok: res.ok && data && data.ok === true };
          });
      })
      .then(function (result) {
        if (result.ok) {
          succeed();
        } else {
          showStatus(copy.error, "error");
          setBusy(false);
          resetChallenge();
        }
      })
      .catch(function () {
        showStatus(copy.error, "error");
        setBusy(false);
        resetChallenge();
      });
  });
})();
