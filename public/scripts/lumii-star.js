/*
 * Lumii star interactions. External so it runs under `script-src 'self'` (no
 * inline). Wires every `[data-lumii-star]` on the page once: cursor-following
 * eyes + lean, a spontaneous hop and wink, and a click celebration. Autonomous
 * motion (hop/wink) is skipped under prefers-reduced-motion; the CSS handles the
 * rest. Idempotent — safe even if the tag is emitted per component instance.
 */
(function () {
  function init() {
    if (window.__lumiiStarWired) return;
    window.__lumiiStarWired = true;

    var reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var stars = document.querySelectorAll("[data-lumii-star]");
    if (!stars.length) return;

    function clamp(x, m) {
      return Math.max(-m, Math.min(m, x));
    }

    stars.forEach(function (scene) {
      var svg = scene.querySelector("svg");
      var eyetrack = scene.querySelector(".lstar-eyetrack");
      var lean = scene.querySelector(".lstar-lean");
      var floatG = scene.querySelector(".lstar-float");
      var eyeL = scene.querySelector(".lstar-eyeL");
      if (!svg || !eyetrack) return;

      window.addEventListener(
        "mousemove",
        function (e) {
          var b = svg.getBoundingClientRect();
          if (!b.width) return;
          var s = b.width / 220;
          var dx = e.clientX - (b.left + 110 * s);
          var dy = e.clientY - (b.top + 108 * s);
          eyetrack.setAttribute(
            "transform",
            "translate(" +
              clamp(dx / 20, 3.4).toFixed(2) +
              " " +
              clamp(dy / 20, 3).toFixed(2) +
              ")",
          );
          if (lean) {
            lean.setAttribute(
              "transform",
              "translate(" +
                clamp(dx / 46, 3.6).toFixed(2) +
                " " +
                clamp(dy / 62, 2.2).toFixed(2) +
                ")",
            );
          }
        },
        { passive: true },
      );

      scene.addEventListener("mouseleave", function () {
        eyetrack.setAttribute("transform", "translate(0 0)");
        if (lean) lean.setAttribute("transform", "translate(0 0)");
      });

      scene.addEventListener("click", function () {
        scene.classList.remove("is-celebrating");
        void scene.offsetWidth;
        scene.classList.add("is-celebrating");
        setTimeout(function () {
          scene.classList.remove("is-celebrating");
        }, 840);
      });

      if (!reduce) {
        (function hop() {
          if (!scene.classList.contains("is-celebrating") && floatG) {
            floatG.classList.add("is-hopping");
            setTimeout(function () {
              floatG.classList.remove("is-hopping");
            }, 720);
          }
          setTimeout(hop, 6000 + Math.random() * 6000);
        })();
        (function wink() {
          if (eyeL) {
            eyeL.classList.add("is-winking");
            setTimeout(function () {
              eyeL.classList.remove("is-winking");
            }, 520);
          }
          setTimeout(wink, 7000 + Math.random() * 7000);
        })();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
