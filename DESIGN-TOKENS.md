# Lumii Web Design Tokens — provenance

Every token in `src/styles/tokens.css` is traced here to its source in the
macOS/SwiftUI app (`/Users/garthpywell/Desktop/Lumii`). The app is the design
authority; the website mirrors it so the two read as one product.

**Resolution model:** `tokens.css` holds the canonical custom properties (light
in `:root`, dark in `:root[data-theme="dark"]` + the `prefers-color-scheme`
fallback). `global.css`'s `@theme inline` block mirrors them into Tailwind v4
utility namespaces (`bg-surface`, `text-accent`, `rounded-lg`, `shadow-card`,
`font-display`, `py-section`, …). In Tailwind v4 that `@theme` block **is** the
"tailwind config" — there is no `tailwind.config.js`.

Three provenance classes:

- **EXACT** — value copied verbatim from the app.
- **DERIVED** — computed from app values (e.g. the dark palette, fluid type
  steps) following the app's own construction patterns. Marked as such.
- **WEB-NEW** — has no app equivalent because it's a web-only concern (z-index
  layers, fluid section spacing, focus ring). Built to match the app's feel.

---

## Colour — light palette (EXACT)

Source: `Lumii/Models/Services/ViewModels/Views/Shared/ThemeManager.swift`,
the default **"Lumii Platinum"** theme (≈ L34–40).

| Web token         | Value     | App field        |
| ----------------- | --------- | ---------------- |
| `--bg`            | `#EFFBF7` | background       |
| `--surface`       | `#FFFDF8` | surface          |
| `--surface-2`     | `#C7F0E5` | surface2         |
| `--border`        | `#8FD4C3` | border           |
| `--accent`        | `#00A895` | accent           |
| `--accent-blue`   | `#315CFF` | accentBlue       |
| `--accent-amber`  | `#E77C12` | accentAmber      |
| `--danger`        | `#D72552` | danger           |
| `--success`       | `#009E63` | success          |
| `--text`          | `#10202C` | textPrimary      |
| `--text-secondary`| `#264F67` | textSecondary    |
| `--text-muted`    | `#587187` | textMuted        |

## Colour — brand constants (EXACT, theme-independent)

Source: `LumiiDesignSystem.swift` L212–220. Lumii's "warm clinical glow"
signature; stable across light/dark. Drive the aurora/accent gradients.

| Web token        | Value     | App field      |
| ---------------- | --------- | -------------- |
| `--brand-teal`   | `#00A895` | accent (mark)  |
| `--brand-warmth` | `#F4B6A6` | platinumWarmth |
| `--brand-gold`   | `#F2C766` | platinumGold   |
| `--brand-lilac`  | `#AFA7FF` | platinumLilac  |
| `--brand-ink`    | `#0B0F1A` | inkOnLight     |

## Colour — dark palette "Platinum Night" (DERIVED)

Source pattern: the app's dark themes (ThemeManager.swift L100–154 — e.g. "Blue
Hour Glass" L132–138). No single app dark theme is teal-accented, so this is
derived to keep the Platinum teal identity while following the app's dark
construction (deep desaturated ground, raised surfaces, brightened accents).

| Web token   | Value     | Rationale                          |
| ----------- | --------- | ---------------------------------- |
| `--bg`      | `#07181A` | deep teal-black ground             |
| `--surface` | `#0E2429` | raised surface                     |
| `--surface-2`| `#16343A`| higher surface                     |
| `--border`  | `#2E5A60` | desaturated teal hairline          |
| `--accent`  | `#3FD9C4` | brightened Platinum teal           |
| `--accent-blue` | `#6F91FF` | per app dark convention        |
| `--accent-amber`| `#F2B943` | per app dark convention        |
| `--danger`  | `#FF5B82` | per app dark convention            |
| `--success` | `#3FD98B` | per app dark convention            |
| `--text`    | `#F2FBF9` | near-white, teal-tinted            |
| `--text-secondary` | `#C2DAD6` |                             |
| `--text-muted` | `#87A6A2` |                                 |

## Tag tints (EXACT colour + DERIVED alpha)

Source: `ThemeManager.swift` L198–203. The app applies semantic colour at
low opacity; the web uses `color-mix` so tints re-derive per theme. `--tag-purple`
(`#8B5CF6`) is the one non-palette tag colour (EXACT, L202).

---

## Typography (EXACT scale + DERIVED editorial extension)

Source: `LumiiDesignSystem.swift` L224–235 (base ramp), L366–371 (extended).
The app uses **system fonts** with `.rounded` design on display/headings — the
web mirrors this via `ui-rounded`/"SF Pro Rounded" in `--font-display`. No custom
font files are registered in the app, so none are self-hosted here.

| Web token (pt→rem, EXACT) | Value      | App `LumiiFonts` |
| ------------------------- | ---------- | ---------------- |
| `--text-micro`            | 0.625rem   | micro (10)       |
| `--text-label`            | 0.6875rem  | label (11)       |
| `--text-caption`          | 0.75rem    | caption (12)     |
| `--text-body-compact`     | 0.8125rem  | body (13)        |
| `--text-subhead`          | 0.875rem   | subhead (14)     |
| `--text-card-headline`    | 0.9375rem  | cardHeadline (15)|
| `--text-headline`         | 1.0625rem  | headline (17)    |
| `--text-title`            | 1.5rem     | title (24)       |
| `--text-display`          | 1.75rem    | display/metric (28) |

**DERIVED (web editorial):** `--text-body` (17px, comfortable marketing body),
`--text-lead`, `--text-h4…--text-h1`, `--text-display-1` — fluid `clamp()` steps
continuing the app's scale ratio for marketing typography (the app's 28px display
is too small for a web hero).

Weights EXACT (400/500/600/700). Leading/tracking are DERIVED (the app sets these
per-call, not as named tokens): tight 1.1 display → relaxed 1.65 prose; tracking
−0.022em display → +0.08em uppercase eyebrows.

---

## Spacing (EXACT base + WEB-NEW extension)

Source: `LumiiDesignSystem.swift` L374–381.

| Web token (EXACT) | px  | App `LumiiSpacing` |
| ----------------- | --- | ------------------ |
| `--space-xs`      | 4   | xs                 |
| `--space-sm`      | 8   | sm                 |
| `--space-md`      | 12  | md                 |
| `--space-lg`      | 16  | lg                 |
| `--space-xl`      | 24  | xl                 |
| `--space-2xl`     | 32  | xxl                |

WEB-NEW: `--space-3xl…6xl` (48/64/96/128), `--space-section` & `--space-gutter`
(fluid), `--measure`/`--content-max`/`--content-wide` — marketing layout rhythm
with no app equivalent.

## Radii (EXACT)

Source: `LumiiDesignSystem.swift` L384–391. xs 6 · sm 10 · md 14 · lg 18 · xl 24
· pill 999 → `--radius-xs…--radius-pill`.

## Shadows / elevation (EXACT mapping)

Source: `LumiiDesignSystem.swift` L394–399 (opacity + blur + y-offset).

| Web token          | box-shadow                    | App `LumiiShadow` |
| ------------------ | ----------------------------- | ----------------- |
| `--shadow-hairline`| 0 1px 1px rgba(0,0,0,.022)    | hairline          |
| `--shadow-subtle`  | 0 3px 7px rgba(0,0,0,.04)     | subtle            |
| `--shadow-card`    | 0 7px 18px rgba(0,0,0,.062)   | card              |
| `--shadow-elevated`| 0 12px 28px rgba(0,0,0,.095)  | elevated          |
| `--shadow-modal`   | 0 16px 38px rgba(0,0,0,.16)   | modal             |

`--shadow-accent` (WEB-NEW) reproduces the app's primary-button accent glow as a
single token. Dark-mode shadow opacities are DERIVED (deepened for dark grounds).

## Motion (EXACT)

Source: `LumiiDesignSystem.swift` L410–415. quick 150ms · standard 220ms · smooth
300ms (+ slow 500ms WEB-NEW). Easings: `--ease-standard` (easeOut), `--ease-out`,
`--ease-in-out`; `--ease-spring` is a cubic-bezier approximation of the app's
`spring(response:0.35, dampingFraction:0.85)`.

## Borders / z-index / focus (WEB-NEW, app-aligned)

Border widths (0.5/1/1.5px) approximate the app's 0.7–0.9pt strokes at web DPR.
`--z-base…--z-max` is a web layering scale (no app analogue). `--focus-ring` is a
single accessible focus token (3px accent ring) used by every interactive element.

---

## Components → app provenance

| Web component (`src/components/`) | App analogue (`LumiiDesignSystem.swift` unless noted) |
| --------------------------------- | ----------------------------------------------------- |
| `primitives/Button.astro`         | `LumiiButton` L1255–1360 (gradient primary / ghost / danger) |
| `primitives/Badge.astro`          | `LumiiTag` L1209–1253                                  |
| `primitives/Card.astro`           | `.lumiiCard` / `.lumiiElevatedCard` modifiers L1150+   |
| `primitives/Input.astro`          | `LumiiTextField` L1362–1396                            |
| `primitives/Stat.astro`           | `metric` font L366 (KPI hero)                          |
| `primitives/Link.astro`           | app text-link styling                                 |
| `sections/*` (Nav, Footer, Hero, FeatureBlock, LogoWall, CTA, Testimonial, FAQ, PricingTable) | composed from the primitives + tokens; no single app source |

Live gallery: `/en-au/components` (noindex).
