import React from 'react';
import { FaSpotify, FaApple, FaFacebookF, FaInstagram, FaMusic, FaPlay, FaHeart, FaShare, FaCalendarAlt, FaUsers, FaTimes, FaExternalLinkAlt, FaPlus, FaSignInAlt, FaChevronLeft, FaChevronRight, FaBookmark, FaComment, FaChartLine } from 'react-icons/fa';
import { IconType } from 'react-icons';

/* eslint-disable react-refresh/only-export-components */
// Platform icon mapping
export const PLATFORM_ICONS: Record<string, IconType> = {
  spotify: FaSpotify,
  'apple-music': FaApple,
  apple: FaApple,
  facebook: FaFacebookF,
  instagram: FaInstagram,
  default: FaMusic
};

// Action icons
export const ACTION_ICONS: Record<string, IconType> = {
  play: FaPlay,
  heart: FaHeart,
  share: FaShare,
  calendar: FaCalendarAlt,
  users: FaUsers,
  close: FaTimes,
  external: FaExternalLinkAlt,
  plus: FaPlus,
  login: FaSignInAlt,
  chevronLeft: FaChevronLeft,
  chevronRight: FaChevronRight,
  bookmark: FaBookmark,
  comment: FaComment,
  trending: FaChartLine,
  music: FaMusic
};

// Helper component for platform icons with consistent styling
interface PlatformIconProps {
  platform: string;
  size?: number;
  className?: string;
  color?: string;
}

export const PlatformIcon: React.FC<PlatformIconProps> = ({
  platform,
  size = 20,
  className = '',
  color
}) => {
  const Icon = PLATFORM_ICONS[platform.toLowerCase()] || PLATFORM_ICONS.default;
  return <Icon size={size} className={className} color={color} />;
};

// Get platform brand colors
export const PLATFORM_COLORS: Record<string, string> = {
  spotify: '#1DB954',
  'apple-music': '#FC3C44',
  apple: '#A8DADC',
  facebook: '#1877F2',
  instagram: '#E4405F',
  default: 'currentColor'
};
