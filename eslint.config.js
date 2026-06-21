// Flat ESLint config. TypeScript + Astro. Intentionally lean — the heavy lifting
// is `astro check` (typecheck) in CI; ESLint guards code-smell and the
// no-hardcoded-direction / no-physical-CSS conventions live in review + docs.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import globals from "globals";

export default [
  { ignores: ["dist/", ".astro/", "node_modules/", "*.config.*"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
      "@typescript-eslint/consistent-type-imports": "warn",
    },
  },
  // Browser-only vanilla scripts served from public/ (no bundling).
  {
    files: ["public/**/*.js"],
    languageOptions: { globals: globals.browser },
  },
  // Node build/CI scripts.
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: globals.node },
  },
  // Astro generates triple-slash references in env/types declaration files.
  {
    files: ["**/*.d.ts"],
    rules: { "@typescript-eslint/triple-slash-reference": "off" },
  },
];
