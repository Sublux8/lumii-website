/*
 * No-flash theme resolver. Loaded synchronously in <head> as an external file
 * (kept out of the HTML so the production CSP can be `script-src 'self'` with no
 * inline allowance). Sets data-theme from the user's saved choice; when none is
 * saved, the CSS prefers-color-scheme query takes over. Runs before first paint.
 */
(function () {
  try {
    var saved = localStorage.getItem("lumii-theme");
    if (saved === "light" || saved === "dark") {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch (e) {
    /* storage blocked (private mode) — fall through to OS preference */
  }
})();
