/*
 * Scroll-reveal. External (CSP-safe). Each `[data-reveal]` fades + rises into
 * place the first time it enters the viewport, then is unobserved. Under
 * prefers-reduced-motion (or without IntersectionObserver), everything is shown
 * immediately. The hiding styles are gated on `html.js` (set pre-paint by
 * theme-init.js), so no-JS visitors always see the content.
 */
(function () {
  function run() {
    var els = document.querySelectorAll("[data-reveal]");
    if (!els.length) return;

    var reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    els.forEach(function (el) {
      io.observe(el);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
