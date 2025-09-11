import React from 'react'
import { FaApple } from 'react-icons/fa'

export interface AppleMusicBadgeProps {
  href: string
  className?: string
  onClick?: () => void
}

/**
 * Apple Music badge-style CTA.
 * Uses a neutral black pill with Apple icon and official wording.
 * Kept as a component so we can swap the image for Apple's official SVG later
 * without touching call sites.
 */
export const AppleMusicBadge: React.FC<AppleMusicBadgeProps> = ({ href, className = '', onClick }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`apple-music-badge ${className}`}
      aria-label="Listen on Apple Music"
      onClick={onClick}
    >
      <FaApple aria-hidden size={16} className="apple-music-badge__icon" />
      <span className="apple-music-badge__text">
        <span className="apple-music-badge__listen">Listen on</span>
        <span className="apple-music-badge__brand">Apple Music</span>
      </span>
    </a>
  )
}

export default AppleMusicBadge

