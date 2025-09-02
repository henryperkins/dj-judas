Visual System – Minimal, Accessible UI

Scope
- Defines shared tokens, components, and patterns for sharing/streaming/social UI.

Color Tokens (HSL)
- --accent: 336 76% 38% (AA on white)
- --accent-600: 336 76% 42% (hover)
- --accent-700: 336 76% 32% (links)
- --ring: mirrors --accent
- Neutrals: --background, --foreground, --card, --border (see src/react-app/index.css)
- Brand (icons/badges only): --brand-facebook, --brand-spotify, --brand-instagram-start

Components
- Buttons: .btn, .btn-primary, .btn-secondary, .btn-ghost (see mobile-first-base.css)
- Cards: plain surfaces with 1px borders; no gradients; radius = var(--radius)
- Tabs: slim, neutral container; active = subtle bg; no glow

Do / Don’t
- Do: use tokens; 4.5:1 small-text contrast; visible focus rings
- Don’t: hardcode hex colors; heavy shadows; gradient backgrounds for standard surfaces; `!important` overrides

Social/Streaming
- Use CreatorMediaPanel tabs as the single hub for Listen/Watch/Social/Share.
- Keep platform colors for icons/left rules only — not surfaces.

Dark Mode
- Never force white backgrounds or black text; inherit tokens.

Accessibility
- Links and buttons meet AA; `:focus-visible` uses --ring.

QA Checklist
- Breakpoints: 360, 390, 768, 1024, 1280
- Modes: light/dark, reduced motion
- Embeds: Spotify/Apple/Facebook/Instagram loading and errors
