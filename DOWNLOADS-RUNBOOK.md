# Downloads & auto-update runbook

How the Lumii macOS app is distributed and auto-updated, and the per-release
workflow. The **§13 Firebase→R2 migration is complete** (mid-2026) — downloads
now serve from Cloudflare R2.

## Architecture (current)

- **App auto-update:** Sparkle 2 (EdDSA-signed). The app's `SUFeedURL` (in
  `Lumii/Lumii-Info.plist`) is `https://download.lumii.com.au/macos/appcast.xml`.
  **Older shipped builds** may still carry
  `https://lumii-prod-3df18.web.app/macos/appcast.xml` — see "Old-build safety
  net" below.
- **Hosting:** the appcast + release archives live in the **Mac app repo** at
  `booking-widget/macos/` (`appcast.xml`, `releases/*.zip` + `*.dmg`) and are
  published to a **Cloudflare R2** bucket (`lumii-downloads`).
  `download.lumii.com.au` is an R2 **custom domain** (Cloudflare-proxied; it
  replaced the old DNS-only CNAME → `lumii-prod-3df18.web.app`).
- **Cache headers** are set per-object at upload time (no separate Cloudflare
  cache rules): `appcast.xml` is `no-cache` (new releases show immediately),
  release archives are `immutable` for a year (filenames are version-stamped).
- **Latest release:** kept in `src/data/release.ts` in this repo (drives the
  `/download` page) and the appcast (drives auto-update). Keep them in lockstep.
- **Signing:** `SUPublicEDKey` is baked into the app; the private key signs each
  release via Sparkle's `generate_appcast`. **The EdDSA private key must never
  leave Garth's machine / a secret store — it is the root of update trust.**

## Per-release workflow

From the **Mac app repo** (`~/Desktop/Lumii`):

1. Build + notarize + staple the app for version `X.Y.Z` (build `N`). Export the
   signed `Lumii.app` into `releases/X.Y.Z/`, and the human DMG into
   `booking-widget/macos/releases/Lumii-X.Y.Z.dmg`.
2. **Generate the appcast** (Sparkle signs + embeds notes; writes the new
   `Lumii-X.Y.Z.zip` enclosure into `booking-widget/macos/releases/`):
   ```bash
   scripts/generate-macos-appcast.sh X.Y.Z
   ```
3. **Publish to R2** (appcast + just this version's artifacts):
   ```bash
   scripts/upload-macos-to-r2.sh X.Y.Z
   ```
   (No arg = re-upload appcast + ALL releases — used for the initial migration /
   a full re-sync. Requires `npx wrangler login`. The script passes `--remote` so
   it hits the real bucket, not the local miniflare simulator.)
4. **Verify:**
   ```bash
   curl -sI https://download.lumii.com.au/macos/appcast.xml | grep -iE '^HTTP|content-type|cf-ray'
   curl -sI https://download.lumii.com.au/macos/releases/Lumii-X.Y.Z.zip | grep -iE '^HTTP|content-length'
   ```
5. **Bump `src/data/release.ts`** in *this* website repo (version / build / url /
   bytes / releasedISO) and open a PR → the `/download` page updates on merge.
   `bytes` = the zip's live `content-length`.

## Old-build safety net (Firebase redirect)

Any shipped build whose `SUFeedURL` still points at
`…lumii-prod-3df18.web.app/macos/appcast.xml` will keep hitting Firebase. Two
options, in order of safety:

- **Simplest (transition):** keep publishing the macos files to Firebase too
  (the old `firebase deploy --only hosting:booking`) for a while, so both hosts
  serve. Costs nothing and is the instant rollback path — repoint the `download`
  CNAME back to `lumii-prod-3df18.web.app` if R2 ever misbehaves.
- **Durable:** add 301 redirects on the Firebase host so old builds follow to R2
  (Sparkle follows 301s), then you can stop deploying the files to Firebase:
  ```jsonc
  "redirects": [
    { "source": "/macos/appcast.xml", "destination": "https://download.lumii.com.au/macos/appcast.xml", "type": 301 },
    { "source": "/macos/releases/**", "destination": "https://download.lumii.com.au/macos/releases/:splat", "type": 301 }
  ]
  ```
  in the app repo `firebase.json` + `firebase deploy --only hosting:booking --project=prod`.

## Notes / gotchas

- **`wrangler r2 object put` needs `--remote`** — without it, it silently writes
  to the LOCAL miniflare R2 simulator (and fails on large files with a misleading
  "connectivity" warning). The upload script already passes it.
- **Content-types matter:** appcast must be `application/xml`, zips
  `application/zip`, dmgs `application/x-apple-diskimage`. The upload script sets
  these; wrong types can break Sparkle parsing or trigger a browser "view"
  instead of a download.
- **EdDSA key custody:** the private key is the entire trust anchor for
  auto-updates. Store it in a password manager / secret store; never commit it.
- **Don't change `SUPublicEDKey`** in the app without a migration plan — every
  shipped build trusts the current key; rotating it requires a transition release.
- **R2 has no egress fees** — fine for serving large DMGs/zips at scale.
- **`DOWNLOAD_PREFIX` / `release.ts` URLs don't change** between Firebase and R2 —
  both serve `https://download.lumii.com.au/macos/…`. The migration only changed
  what's behind the domain.
