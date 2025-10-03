# Repository Guidelines

## Project Structure & Module Organization
The Vite + React storefront lives in `src/react-app`, split by feature directories such as `components/`, `pages/`, `hooks/`, and `lib/`. Worker entrypoints and middleware live in `src/worker`, sharing types from `src/types` and utilities in `src/lib`. Static assets are served from `public/`; build artifacts land in `dist/`. End-to-end resources live in `e2e/`, while deployment helpers and scripts sit at the repo root (`scripts/`, `deploy.sh`, Wrangler configs).

## Build, Test, and Development Commands
- `npm run dev` launches the Vite dev server with worker emulation for rapid iteration.
- `npm run build` compiles TypeScript and generates the worker plus static client bundle in `dist/`.
- `npm run preview` serves the production bundle locally for smoke checks.
- `npm run lint` applies the ESLint ruleset; fix violations before committing.
- `npm run check` runs the CI gate: type-check, build, Wrangler dry-run deploy, and Pa11y accessibility scan.
- `npm run deploy` publishes the worker via Wrangler when credentials are configured.

## Coding Style & Naming Conventions
Stick to TypeScript with 2-space indentation and ES modules. Components and hooks use PascalCase file names (`ThemeToggle.tsx`, `useMetaPixelPageViews.ts`); helpers default to camelCase. Use arrow functions for callbacks and keep Tailwind class lists terse and composable. Run ESLint before pushes; configuration lives in `eslint.config.js` alongside React Hooks rules. Secrets belong in environment variables (`.dev.vars` locally) rather than committed config.

## Testing Guidelines
Playwright specs live under `e2e/tests` with `*.spec.ts` filenames; share helpers in `e2e/utils`. Use `npm run test:e2e` for the headless suite, `npm run test:e2e:ui` when debugging, and `npm run test:e2e:headed` for manual observation. Accessibility budgets are enforced by `npm run check:a11y`; keep violations below the threshold defined in `pa11y.json`.

## Commit & Pull Request Guidelines
Follow the existing `<type>(<scope>): summary` convention, e.g. `fix(mobile): resolve TS errors`. Squash small follow-ups into the feature commit and include context in the body when touching worker or infra files. Validate changes with `npm run check` and relevant Playwright suites before opening a PR. PRs should outline intent, list automated and manual tests, attach UI captures when visuals change, and link the relevant Medusa or infrastructure issue.

## Cloudflare & Medusa Notes
Store Stripe, Medusa, and Meta credentials in Wrangler secrets; never commit `.dev.vars` or `.env`. After changing bindings, run `npm run cf-typegen` so `worker-configuration.d.ts` stays accurate. Coordinate updates in `medusa-backend/` with worker deployment and document API changes in `docs/`.
