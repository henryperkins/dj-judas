/**
 * Centralized motion configuration for PlatformLauncher components
 * Provides consistent animation patterns across inline, modal, and FAB modes
 */

import { Variants } from 'framer-motion'

/**
 * Button hover and tap variants for platform buttons
 */
export const PLATFORM_BUTTON_VARIANTS = {
  hover: {
    scale: 1.05,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1, ease: 'easeIn' }
  },
  focus: {
    outline: '2px solid hsl(var(--ring))',
    outlineOffset: '2px',
    transition: { duration: 0.1, ease: 'easeOut' }
  }
}

/**
 * FAB menu entry animations
 */
export const FAB_MENU_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.8
  },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: index * 0.05,
      duration: 0.2,
      ease: 'easeOut'
    }
  })
}

/**
 * Modal overlay animations
 */
export const MODAL_OVERLAY_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  },
  visible: {
    opacity: 1,
    backdropFilter: 'blur(4px)',
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
}

/**
 * Modal content animations
 */
export const MODAL_CONTENT_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
      staggerChildren: 0.05
    }
  }
}

/**
 * Grid item animations for modal and inline modes
 */
export const GRID_ITEM_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  }
}

/**
 * Reduced motion variants for accessibility
 */
export const REDUCED_MOTION_VARIANTS: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.1
    }
  }
}

/**
 * Get appropriate motion variants based on prefers-reduced-motion
 */
export const getMotionVariants = (prefersReducedMotion: boolean): Variants => {
  if (prefersReducedMotion) {
    return REDUCED_MOTION_VARIANTS
  }
  
  return {
    ...PLATFORM_BUTTON_VARIANTS,
    ...FAB_MENU_VARIANTS,
    ...MODAL_OVERLAY_VARIANTS,
    ...MODAL_CONTENT_VARIANTS,
    ...GRID_ITEM_VARIANTS
  }
}

/**
 * Platform-specific color mapping for consistent theming
 */
export const PLATFORM_COLORS: Record<string, string> = {
  spotify: 'hsl(var(--brand-spotify))',
  apple: 'hsl(var(--accent))',
  instagram: 'linear-gradient(135deg, hsl(var(--brand-instagram-start)), hsl(var(--brand-instagram-end)))',
  facebook: 'hsl(var(--brand-facebook))',
  twitter: 'hsl(203 89% 53%)',
  youtube: 'hsl(0 72% 51%)',
  tiktok: 'hsl(0 0% 5%)'
}