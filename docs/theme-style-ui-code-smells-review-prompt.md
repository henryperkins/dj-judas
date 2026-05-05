# Theme, Style, UI, and Code Smell Review Prompt

Use this prompt to run a focused review of this repository.

```text
You are reviewing `/home/dev/dj-judas`, a Vite + React + TypeScript storefront with Tailwind UI in `src/react-app` and Cloudflare Worker code in `src/worker`.

Goal: identify confirmed theme, style, UI/UX, accessibility, responsiveness, and code-smell issues. This is a review only. Do not edit files.

Follow the repo guidance:
- Use bounded context and targeted reads.
- Prefer `rg`, `rg --files`, and exact line ranges.
- Avoid whole-file dumps unless the file is small.
- Stop rather than silently broadening scope.
- Focus first on `src/react-app/components`, `src/react-app/pages`, `src/react-app/hooks`, `src/react-app/lib`, Tailwind/global CSS/theme files, and any shared layout/navigation/theme components.

Review for:

1. Theme and style issues
- Inconsistent spacing, typography, colors, shadows, borders, radii, or button styles.
- Tailwind class duplication or conflicting classes.
- Hardcoded colors where theme tokens/classes should be used.
- Light/dark mode bugs, missing theme variants, unreadable contrast, or inconsistent state styling.
- UI that feels disconnected from the storefront brand or product experience.

2. UI/UX issues
- Layouts that break on mobile, tablet, or wide desktop.
- Text overflow, clipped content, overlapping elements, poor tap targets, or unstable layout shifts.
- Missing loading, empty, error, disabled, hover, focus, or selected states.
- Navigation, forms, product cards, cart/checkout flows, or filtering/sorting controls that are confusing or brittle.
- Visual hierarchy problems that make key commerce actions hard to scan.

3. Accessibility issues
- Missing labels, weak semantic structure, bad heading order, poor keyboard flow, invisible focus states.
- Color contrast risks.
- Icon-only controls without accessible names.
- Modals, menus, drawers, or overlays with focus/escape/scroll issues.

4. React/TypeScript code smells
- Components doing too much or mixing data fetching, formatting, layout, and interaction logic.
- Repeated JSX/Tailwind blocks that should become shared components.
- Fragile prop drilling, duplicated state, derived state bugs, or stale effects.
- Hooks with unsafe dependencies or side effects.
- Loose types, `any`, unsafe casts, nullable data handled inconsistently.
- Worker/client boundary confusion, duplicated API logic, or environment assumptions.

Output format:
- Findings first, ordered by severity.
- Each finding must include file and line reference.
- Explain the user-facing impact and why the code supports the finding.
- Include only confirmed issues, not guesses.
- Put open questions separately after findings.
- End with a short prioritized remediation list.

Do not include a broad summary unless there are findings. If no issues are found, say that clearly and list the areas inspected plus any remaining test gaps.
```
