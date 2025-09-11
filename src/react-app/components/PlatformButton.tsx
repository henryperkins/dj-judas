import React from 'react'
import { motion } from 'framer-motion'
import { PLATFORM_BUTTON_VARIANTS } from '../utils/motionConfig'
import { getPlatformById, type PlatformId } from '../config/platforms'
import { PlatformIcon } from './icons/PlatformIcons'

interface PlatformButtonProps {
  platformId: PlatformId
  mode?: 'inline' | 'modal' | 'fab'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  'aria-label'?: string
}

/**
 * Consolidated PlatformButton component with consistent styling across modes
 * Replaces duplicated button logic in PlatformLauncher
 */
export const PlatformButton: React.FC<PlatformButtonProps> = ({
  platformId,
  mode = 'inline',
  size = 'md',
  showLabel = true,
  className = '',
  style,
  onClick,
  'aria-label': ariaLabel,
  ...props
}) => {
  const config = getPlatformById(platformId)
  const displayName = config.name

  // Generate accessible label if not provided
  const buttonLabel = ariaLabel || `Open ${displayName}`

  // Size classes for BEM consistency
  const sizeClass = `platform-launcher__icon--${size}`

  // Mode-specific styling
  const getModeClasses = () => {
    switch (mode) {
      case 'inline':
        return 'platform-launcher__button platform-launcher__button--inline'
      case 'modal':
        return 'platform-launcher__button platform-launcher__button--modal'
      case 'fab':
        return 'platform-launcher__button platform-launcher__button--fab'
      default:
        return 'platform-launcher__button'
    }
  }

  // Set platform color as CSS custom property
  const buttonStyle = {
    '--platform-color': config.color,
    ...style
  } as React.CSSProperties

  return (
    <motion.button
      className={`${getModeClasses()} ${className}`}
      style={buttonStyle}
      onClick={onClick}
      aria-label={buttonLabel}
      variants={PLATFORM_BUTTON_VARIANTS}
      whileHover="hover"
      whileTap="tap"
      whileFocus="focus"
      {...props}
    >
      <PlatformIcon
        platform={platformId}
        className={`platform-launcher__icon ${sizeClass}`}
      />

      {showLabel && (
        <span className="platform-launcher__label">
          {displayName}
        </span>
      )}

    </motion.button>
  )
}

/**
 * PlatformButton with colored background variant
 */
export const ColoredPlatformButton: React.FC<PlatformButtonProps> = (props) => {
  return (
    <PlatformButton
      className="platform-launcher__button--colored"
      {...props}
    />
  )
}

/**
 * PlatformButton with icon-only variant
 */
export const IconOnlyPlatformButton: React.FC<PlatformButtonProps> = (props) => {
  return (
    <PlatformButton
      showLabel={false}
      {...props}
    />
  )
}

export default PlatformButton
