/*
 * A tiny progressive-enhancement layer for the launch hero. The product scene
 * responds softly to pointer movement; touch, keyboard and reduced-motion users
 * receive the same complete content without the effect.
 */
(function () {
  function init() {
    var scene = document.querySelector("[data-lumii-scene]");
    var reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var finePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;

    if (!scene || reduce || !finePointer) return;

    var frame = 0;
    scene.addEventListener(
      "pointermove",
      function (event) {
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(function () {
          var bounds = scene.getBoundingClientRect();
          var x = (event.clientX - bounds.left) / bounds.width - 0.5;
          var y = (event.clientY - bounds.top) / bounds.height - 0.5;
          scene.style.setProperty("--scene-x", (-y * 2.2).toFixed(2) + "deg");
          scene.style.setProperty("--scene-y", (x * 2.8).toFixed(2) + "deg");
        });
      },
      { passive: true },
    );

    scene.addEventListener("pointerleave", function () {
      scene.style.setProperty("--scene-x", "0deg");
      scene.style.setProperty("--scene-y", "0deg");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
