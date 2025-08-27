# Mobile Bottom Navigation — Accessibility & Behavior

Implemented improvements to the bottom navigation for better mobile UX and WCAG compliance.

## Changes
- `nav` element now has `role="navigation"` and `aria-label="Primary"`.
- Added list semantics (`ul`/`li`) around nav items.
- Roving tabindex with ArrowLeft/ArrowRight/Home/End keyboard support.
- `aria-current="page"` applied to the active item.
- Share popup announces via `role="status"` + `aria-live="polite"`.
- Safe-area and touch-target sizing maintained; focus-visible outline preserved.

## Files
- Updated: `src/react-app/components/MobileBottomNav.tsx`
- Updated: `src/react-app/components/MobileBottomNav.css`
- Updated: `src/react-app/components/EnhancedLandingPageV2.tsx` (added `<main id="main" tabIndex={-1}>` for the skip link target)

## Notes
- The body gets `mobile-nav-visible` to offset FAB positioning.
- Navigation hides on downward scroll and reappears on upward scroll for content focus.

## Follow-ups
- Extend min-width conversion to other component CSS where `@media (max-width: 768px)` still exists (e.g., SocialProofWall, Embeds, BookingForm).
