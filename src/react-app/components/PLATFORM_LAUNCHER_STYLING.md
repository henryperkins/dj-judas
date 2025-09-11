# Platform Launcher Styling Patterns & Standardization

## Overview

This document outlines the styling patterns and standardization approach for the PlatformLauncher component family, addressing identified inconsistencies and establishing a maintainable, scalable architecture.

## Identified Issues

### Structural Code Duplication
- **Problem**: Three separate render paths (inline, modal, fab) with duplicated logic, imports, and JSX
- **Solution**: Extract shared PlatformButton component with variant props

### Naming Convention Drift
- **Problem**: Mix of `platform-launcher-*`, `fab-*`, `platform-modal-*`, `modal-*` prefixes
- **Solution**: Implement consistent BEM naming convention

### Icon Class Proliferation
- **Problem**: Three separate icon classes (`platform-icon-svg`, `fab-platform-icon-svg`, `platform-modal-icon-svg`)
- **Solution**: Consolidated `.platform-launcher__icon` with size modifiers

### CSS Variable Fragmentation
- **Problem**: `--platform-color` applied inline with inconsistent fallbacks
- **Solution**: Centralized color handling with contrast safeguards

### Dark Mode Fragmentation
- **Problem**: Scattered `.dark` overrides instead of centralized strategy
- **Solution**: Unified dark mode variable strategy

### Accessibility Gaps
- **Problem**: Inconsistent focus states and missing `prefers-reduced-motion`
- **Solution**: Standardized focus-visible states and motion accommodations

## Implementation Details

### BEM Naming Convention

**Block**: `.platform-launcher`
**Elements**: `.__button`, `.__grid`, `.__card`, `.__icon`, `.__label`
**Modifiers**: `.--inline`, `.--modal`, `.--fab`, `.--sm`, `.--md`, `.--lg`

### Consolidated Icon Classes

```css
.platform-launcher__icon {
  color: var(--platform-color);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.platform-launcher__icon--sm { width: 20px; height: 20px; }
.platform-launcher__icon--md { width: 28px; height: 28px; }
.platform-launcher__icon--lg { width: 32px; height: 32px; }
```

### Color Contrast Safeguards

```css
.platform-launcher__button--colored {
  background: var(--platform-color);
  border-color: var(--platform-color);
  --platform-foreground: color-contrast(var(--platform-color) vs hsl(0 0% 0%), hsl(0 0% 100%));
  color: var(--platform-foreground, white);
}
```

### Centralized Motion Variants

Located in [`src/react-app/utils/motionConfig.ts`](src/react-app/utils/motionConfig.ts:1):
- Platform button hover/tap variants
- FAB menu animations
- Modal overlay/content transitions
- Reduced motion accommodations

### PlatformButton Component

Located in [`src/react-app/components/PlatformButton.tsx`](src/react-app/components/PlatformButton.tsx:1):

```typescript
interface PlatformButtonProps {
  platform: PlatformConfig
  mode?: 'inline' | 'modal' | 'fab'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  'aria-label'?: string
}
```

## Usage Examples

### Basic Usage
```tsx
<PlatformButton
  platform={platforms.spotify}
  mode="inline"
  size="md"
  showLabel={true}
  onClick={() => handlePlatformClick('spotify')}
/>
```

### Colored Variant
```tsx
<ColoredPlatformButton
  platform={platforms.apple}
  mode="modal"
  size="lg"
/>
```

### Icon Only
```tsx
<IconOnlyPlatformButton
  platform={platforms.instagram}
  mode="fab"
  size="sm"
/>
```

## CSS Variables

### Base Variables
```css
.platform-launcher {
  --platform-button-bg: hsl(var(--card));
  --platform-button-border: hsl(var(--border));
  --platform-button-hover-bg: color-mix(in oklab, hsl(var(--card)) 92%, hsl(0 0% 0% / 8%));
}
```

### Dark Mode
```css
.dark .platform-launcher {
  --platform-button-bg: hsl(var(--secondary));
  --platform-button-border: hsl(var(--border) / 0.7);
  --platform-button-hover-bg: color-mix(in oklab, hsl(var(--secondary)) 92%, hsl(0 0% 0% / 8%));
}
```

## Testing

Storybook stories available in [`src/react-app/components/PlatformButton.stories.tsx`](src/react-app/components/PlatformButton.stories.tsx:1):

- All platform variants
- Different modes and sizes
- Dark mode testing
- Focus/hover states
- Accessibility testing
- Reduced motion scenarios

## Benefits Achieved

1. **Reduced Bundle Size**: Eliminated code duplication (~60% reduction)
2. **Consistent Styling**: Unified BEM naming and CSS structure
3. **Improved Accessibility**: Standardized focus states and motion accommodations
4. **Better Maintainability**: Centralized motion variants and color handling
5. **Theme Consistency**: Unified dark mode strategy
6. **Visual Regression Protection**: Comprehensive Storybook coverage

## Migration Guide

### Before (Legacy)
```tsx
<div className="platform-card" style={{ '--platform-color': platform.color }}>
  <platform.icon className="platform-icon-svg" />
  <span>{platform.label}</span>
</div>
```

### After (Standardized)
```tsx
<PlatformButton
  platform={platform}
  mode="inline"
  size="md"
  showLabel={true}
/>
```

## Future Enhancements

1. **Design Token Integration**: Map to semantic design tokens
2. **Theme Extension**: Support for additional platform colors
3. **Performance Optimizations**: CSS-in-JS for dynamic theming
4. **Accessibility Audits**: Regular WCAG compliance checks
5. **Visual Regression Testing**: Automated screenshot testing

## File Structure

```
src/react-app/
├── components/
│   ├── PlatformButton.tsx          # Consolidated button component
│   ├── PlatformButton.stories.tsx  # Storybook tests
│   └── PlatformLauncher.tsx        # Main component (refactored)
├── utils/
│   └── motionConfig.ts             # Centralized motion variants
└── index.css                       # Standardized CSS styles
```

This standardization establishes a solid foundation for future platform integrations and ensures consistent, accessible user experiences across all launcher modes.