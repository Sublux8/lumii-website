// Live-updates the /download page from the Sparkle appcast (via the same-origin
// /api/mac-release endpoint), so a freshly published release shows immediately
// with no site rebuild. Progressive enhancement: if the fetch fails, the
// server-rendered (baked) values from src/data/release.ts stay in place.
//
// CSP: external same-origin script (script-src 'self') fetching a same-origin
// path (connect-src 'self') — both already allowed.
(function () {
  var meta = document.querySelector("[data-download-meta]");
  // The <Button> primitive maps its `id` prop to `data-cta` (analytics hook), not
  // a real id attribute — so select on what actually renders, not getElementById.
  var btn = document.querySelector('[data-cta="download-macos"]');
  if (!meta || !btn) return;

  var tmplVersion = meta.getAttribute("data-tmpl-version") || "";
  var tmplReq = meta.getAttribute("data-tmpl-requirements") || "";
  var tmplReleased = meta.getAttribute("data-tmpl-released") || "";
  var localeTag = meta.getAttribute("data-locale") || "en-AU";

  var elVersion = document.getElementById("dl-version");
  var elReq = document.getElementById("dl-requirements");
  var elReleased = document.getElementById("dl-released");

  function fmtSize(bytes) {
    return (bytes / 1e6).toFixed(1) + " MB";
  }

  function fmtDate(iso) {
    // Pin to UTC so the "Released …" date matches the appcast's calendar day
    // regardless of the viewer's timezone.
    try {
      return new Intl.DateTimeFormat(localeTag, {
        dateStyle: "long",
        timeZone: "UTC",
      }).format(new Date(iso + "T00:00:00Z"));
    } catch (e) {
      return iso;
    }
  }

  function fill(tmpl, vars) {
    return tmpl.replace(/\{(\w+)\}/g, function (whole, key) {
      return key in vars ? vars[key] : whole;
    });
  }

  fetch("/api/mac-release", { headers: { accept: "application/json" } })
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(function (d) {
      if (!d || !d.ok || !d.version) return;

      // Human download = the DMG (drag-to-Applications installer).
      if (d.dmgUrl) btn.setAttribute("href", d.dmgUrl);

      if (elVersion && tmplVersion) {
        elVersion.textContent = fill(tmplVersion, { version: d.version });
      }
      if (elReq && tmplReq) {
        elReq.textContent = fill(tmplReq, {
          minMacOS: d.minMacOS,
          size: fmtSize(d.bytes),
        });
      }
      if (elReleased && tmplReleased && d.releasedISO) {
        elReleased.textContent = fill(tmplReleased, { date: fmtDate(d.releasedISO) });
      }
    })
    .catch(function () {
      /* keep the baked values */
    });
})();
