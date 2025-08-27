# Accessibility Audit (Pa11y/Axe)

Pa11y is integrated into the check pipeline and runs against the preview server.

## How to Run
- `npm run check:a11y` — builds, starts `vite preview` on port 4173, runs Pa11y (Axe), then shuts down the server.
- `npm run check` — includes `check:a11y` after typecheck + build + wrangler dry-run.

## Configuration
- File: `pa11y.json`
  - `runners: ["axe"]`
  - `chromeLaunchConfig.args: ["--no-sandbox", "--disable-setuid-sandbox"]` for CI/containers
  - `hideElements: "iframe"` to avoid noisy 3rd‑party embed rules
  - Threshold: see `package.json` script (`--threshold 10`)

## Current Top Issues (initial run)
- Predominantly color‑contrast failures on hero text, CTA buttons, and social cards.
- Some contrast in filters/tags and footer headings.

## Suggested Fixes (follow‑ups)
- Increase contrast in hero overlay and buttons (e.g., stronger overlay, darker text on light backgrounds).
- Ensure all CTA and badge backgrounds meet 4.5:1 against text color.
- Verify focus states remain visible with increased contrast.

You can iterate locally by adjusting CSS variables and re‑running `npm run check:a11y`.
