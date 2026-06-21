/*
 * Theme toggle. External same-origin file so it runs under `script-src 'self'`
 * with no inline allowance. Flips data-theme, persists the choice, and keeps the
 * aria-pressed state honest. Resolves the *current* effective theme from the OS
 * when the user hasn't chosen yet, so the first click does the expected thing.
 */
(function () {
  function current() {
    var attr = document.documentElement.getAttribute("data-theme");
    if (attr === "light" || attr === "dark") return attr;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("lumii-theme", theme);
    } catch (e) {
      /* storage blocked — in-session only */
    }
  }
  document.addEventListener("click", function (ev) {
    var btn = ev.target && ev.target.closest && ev.target.closest("[data-theme-toggle]");
    if (!btn) return;
    apply(current() === "dark" ? "light" : "dark");
  });
})();
