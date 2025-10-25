import React from 'react'

export interface AppleMusicBadgeProps {
  href: string
  className?: string
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
}

/**
 * Apple Music badge using official (or placeholder) badge artwork.
 *
 * IMPORTANT: To comply with Apple Music Identity Guidelines, replace the placeholder SVG
 * at /public/assets/apple-music-badge.svg with the official badge from:
 * https://developer.apple.com/apple-music/marketing-guidelines/
 *
 * Requirements:
 * - Minimum size: 120x40px (maintained by this component)
 * - Clear space: 8px on all sides
 * - No modifications to official artwork (color, text, proportions)
 * - "Listen on Apple Music" badge for streaming links
 * - "Get it on Apple Music" badge for app download links (if applicable)
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
      style={{
        display: 'inline-block',
        padding: '8px', // Clear space as required by guidelines
        minWidth: '120px',
        minHeight: '40px'
      }}
    >
      <img
        src="/assets/apple-music-badge.svg"
        alt="Listen on Apple Music"
        width="120"
        height="40"
        style={{
          display: 'block',
          width: '120px',
          height: '40px'
        }}
      />
    </a>
  )
}

export default AppleMusicBadge
