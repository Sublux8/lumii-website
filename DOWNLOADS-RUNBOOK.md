# Downloads & auto-update runbook (Phase 1)

How the Lumii macOS app is distributed and auto-updated, the **§13 Firebase→R2
drain**, and the per-release workflow.

## Current architecture (pre-drain)

- **App auto-update:** Sparkle 2 (EdDSA-signed). The app's `SUFeedURL` (in
  `Lumii/Lumii-Info.plist`, current source) is already
  `https://download.lumii.com.au/macos/appcast.xml`. **Older shipped builds**
  still carry `https://lumii-prod-3df18.web.app/macos/appcast.xml` — both must
  keep working.
- **Hosting (today):** the appcast + release zips live in the **Mac app repo** at
  `booking-widget/macos/` (`appcast.xml`, `releases/*.zip`) and are deployed to
  **Firebase Hosting**. `download.lumii.com.au` is a Firebase custom domain
  (Cloudflare DNS-only CNAME → `lumii-prod-3df18.web.app`).
- **Latest release:** 0.9.53 (build 953), macOS 15.6+, enclosure already
  `https://download.lumii.com.au/macos/releases/Lumii-0.9.53.zip` (EdDSA-signed).
- **Signing:** `SUPublicEDKey` is baked in the app; private key signs each
  release via Sparkle's `sign_update`. **The EdDSA private key must never leave
  Garth's machine / a secret store — it is the root of update trust.**

## §13 Firebase → R2 drain

Goal: serve the appcast + zips from **Cloudflare R2** via `download.lumii.com.au`,
off Firebase, without breaking auto-updates for any shipped build.

> ⚠️ **Sequencing is load-bearing.** `download.lumii.com.au` is live and shipped
> apps fetch their updates from it. Upload everything to R2 and verify **before**
> repointing the domain, or in-field auto-updates break.

### 1. Create the R2 bucket (Garth — Cloudflare account)
- Cloudflare → R2 → **Create bucket** → name `lumii-downloads`, location
  **APAC** (Sydney jurisdiction if offered).

### 2. Upload the existing tree, paths preserved
Mirror the current `booking-widget/macos/` into the bucket root so URLs are
unchanged (`/macos/appcast.xml`, `/macos/releases/*.zip`):
```bash
# from the Mac app repo, with R2 creds configured (rclone or aws-cli to the R2 S3 API)
aws s3 sync booking-widget/macos/ s3://lumii-downloads/macos/ \
  --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com \
  --content-type application/octet-stream
# Then FIX content-types so Sparkle + browsers behave:
aws s3 cp s3://lumii-downloads/macos/appcast.xml s3://lumii-downloads/macos/appcast.xml \
  --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com \
  --content-type "application/xml; charset=utf-8" --metadata-directive REPLACE
# zips: --content-type application/zip ; dmgs: application/x-apple-diskimage
```
(Or upload via the R2 dashboard and set content-type per object.)

### 3. Point `download.lumii.com.au` at R2
- R2 → `lumii-downloads` → **Settings → Custom Domains → Connect Domain** →
  `download.lumii.com.au`. Cloudflare will replace the existing DNS-only
  CNAME→Firebase with the R2 binding (it manages the record; you may need to
  delete the old `download` CNAME first).
- Wait for the custom domain to show **Active** (cert provisions).

### 4. Verify R2 is serving (before relying on it)
```bash
curl -sI https://download.lumii.com.au/macos/appcast.xml | grep -iE '^HTTP|content-type|cf-ray'   # cf-ray present = R2/CF, not Firebase
curl -sI https://download.lumii.com.au/macos/releases/Lumii-0.9.53.zip | grep -iE '^HTTP|content-type|content-length'
curl -s  https://download.lumii.com.au/macos/appcast.xml | head -5   # valid appcast XML
```

### 5. Old-build safety net (Firebase redirect)
Shipped builds with `SUFeedURL = …web.app/macos/appcast.xml` must still resolve.
In the **Mac app repo** `firebase.json`, add a redirect on the host that serves
`lumii-prod-3df18.web.app` (Sparkle follows 301s):
```jsonc
"redirects": [
  { "source": "/macos/appcast.xml", "destination": "https://download.lumii.com.au/macos/appcast.xml", "type": 301 },
  { "source": "/macos/releases/**", "destination": "https://download.lumii.com.au/macos/releases/:splat", "type": 301 }
]
```
Then `firebase deploy --only hosting:<the macos-serving target> --project=prod`.
(Claude can prepare this edit — say the word; it's an app-repo change.)

### 6. Decommission Firebase macos hosting (optional, later)
Once analytics confirm no traffic hits the Firebase `/macos/*` except via the
redirect, you can stop deploying `booking-widget/macos/` to Firebase. Keep the
redirect indefinitely (old builds live a long time).

## Per-release workflow (going forward)

1. Build + archive the app (version `X.Y.Z`, build `N`).
2. Export `Lumii-X.Y.Z.zip` (or `.dmg`).
3. **Sign** with Sparkle (EdDSA private key):
   ```bash
   ./bin/sign_update Lumii-X.Y.Z.zip   # prints sparkle:edSignature + length
   ```
4. Add an `<item>` to `appcast.xml` (or regenerate with Sparkle's
   `generate_appcast` against the releases dir) — enclosure URL
   `https://download.lumii.com.au/macos/releases/Lumii-X.Y.Z.zip`, the
   `edSignature`, `length`, `sparkle:version`, `minimumSystemVersion`.
5. Upload the zip + updated `appcast.xml` to R2 (`macos/releases/` + `macos/`),
   correct content-types.
6. **Bump `src/data/release.ts`** in this website repo (version/build/url/bytes/
   date) and open a PR → the `/download` page updates on merge.

## Notes / gotchas
- **Content-types matter:** appcast must be `application/xml`, zips
  `application/zip`. R2 serves whatever was set at upload; wrong types can break
  Sparkle parsing or trigger browser "view" instead of download.
- **EdDSA key custody:** the private key is the entire trust anchor for
  auto-updates. Store it in a password manager / secret store; never commit it,
  never put it in CI without a hardened secret.
- **Don't change `SUPublicEDKey`** in the app without a migration plan — every
  shipped build trusts the current key; rotating it requires a transition release.
- **R2 has no egress fees** — fine for serving large DMGs/zips at scale.
