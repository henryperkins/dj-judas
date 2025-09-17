import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlatformIcon, PLATFORM_COLORS, ACTION_ICONS } from './icons/PlatformIcons';
import {
  openPlatform,
  trackPlatformClick,
  isMobileDevice,
  type PlatformLink
} from '../utils/platformDetection';
import { getPlatformLinksAny, PLATFORM_CONFIG } from '../config/platforms';

const { close: CloseIcon, external: ExternalIcon, music: MusicIcon } = ACTION_ICONS;

export interface PlatformLauncherProps {
  mode?: 'floating' | 'inline' | 'modal';
  simplified?: boolean;
  className?: string;
  onPlatformClick?: (platform: string) => void;
  showLabels?: boolean; // New prop to control text visibility
}

const PlatformLauncher: React.FC<PlatformLauncherProps> = ({
  mode = 'floating',
  simplified = true,
  className = '',
  onPlatformClick,
  showLabels = false // Default to icon-only for minimal design
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [platforms, setPlatforms] = useState<PlatformLink[]>([]);

  useEffect(() => {
    const ids = ['spotify','appleMusic','facebook','instagram'] as const;
    const links: PlatformLink[] = ids.map((id) => {
      const { platformId, deepLink, webLink } = getPlatformLinksAny(id);
      if (!platformId || !webLink) return null as unknown as PlatformLink;
      const isListen = platformId === 'spotify' || platformId === 'appleMusic';
      const label = `${isListen ? 'Listen on' : 'Follow on'} ${PLATFORM_CONFIG[platformId].name}`;
      return {
        platform: platformId as PlatformLink['platform'],
        deepLink,
        webLink: webLink!,
        label,
        icon: platformId
      };
    }).filter(Boolean) as PlatformLink[];
    setPlatforms(links);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice());
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lightweight cross-component control via custom events
  // Allows other components (e.g., MobileBottomNav) to open/close the FAB
  useEffect(() => {
    const OPEN_EVENT = 'platform-launcher:open';
    const CLOSE_EVENT = 'platform-launcher:close';
    const TOGGLE_EVENT = 'platform-launcher:toggle';

    const openHandler = () => setIsOpen(true);
    const closeHandler = () => setIsOpen(false);
    const toggleHandler = () => setIsOpen(prev => !prev);

    window.addEventListener(OPEN_EVENT, openHandler as EventListener);
    window.addEventListener(CLOSE_EVENT, closeHandler as EventListener);
    window.addEventListener(TOGGLE_EVENT, toggleHandler as EventListener);
    return () => {
      window.removeEventListener(OPEN_EVENT, openHandler as EventListener);
      window.removeEventListener(CLOSE_EVENT, closeHandler as EventListener);
      window.removeEventListener(TOGGLE_EVENT, toggleHandler as EventListener);
    };
  }, []);

  const getPlatformColor = (platform: string): string => {
    return PLATFORM_COLORS[platform.toLowerCase() as keyof typeof PLATFORM_COLORS] || PLATFORM_COLORS.default;
  };

  const handlePlatformClick = (link: PlatformLink) => {
    trackPlatformClick(link.platform, mode);

    if (onPlatformClick) {
      onPlatformClick(link.platform);
    }

    if (simplified || isMobile) {
      // In simplified mode or on mobile, just open the platform
      openPlatform(link, () => {
        console.log(`Opening ${link.platform}`);
      });
    } else {
      // In full mode on desktop, could trigger OAuth flow
      // For now, still just open the platform
      openPlatform(link);
    }

    // Close the launcher after clicking
    if (mode === 'floating') {
      setTimeout(() => setIsOpen(false), 300);
    }
  };




  if (mode === 'inline') {
    return (
      <div className={`platform-launcher-inline ${className} ${!showLabels ? 'icons-only' : ''}`}>
        <h3 className="platform-launcher-title">Connect & Listen</h3>
        <div className="platform-grid">
          {platforms.map((link) => (
            <motion.button
              key={link.platform}
              className="platform-card"
              onClick={() => handlePlatformClick(link)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Open ${link.label}`}
              style={{
                '--platform-color': getPlatformColor(link.platform)
              } as React.CSSProperties}
            >
              <PlatformIcon
                platform={link.platform}
                size={20}
                className="platform-icon-svg"
              />
              {/* Always provide a discernible name for a11y */}
              <span className="sr-only">{link.label}</span>
              {showLabels && (
                <>
                  <span className="platform-name">{link.label}</span>
                  <ExternalIcon className="platform-external-icon" size={14} aria-hidden />
                </>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  if (mode === 'modal') {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="platform-launcher-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="platform-launcher-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button
                className="modal-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <CloseIcon size={24} />
              </button>
              <h2>Choose Your Platform</h2>
              <div className="platform-modal-grid">
                {platforms.map((link) => (
                  <motion.button
                    key={link.platform}
                    className="platform-modal-button"
                    onClick={() => handlePlatformClick(link)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      '--platform-color': getPlatformColor(link.platform)
                    } as React.CSSProperties}
                  >
                    <PlatformIcon
                      platform={link.platform}
                      size={32}
                      className="platform-modal-icon-svg"
                    />
                    {showLabels || mode === 'modal' ? (
                      <span className="platform-modal-name">
                        {link.label.replace('Listen on ', '').replace('Follow on ', '')}
                      </span>
                    ) : null}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Floating FAB mode (default for mobile)
  return (
    <>
      <motion.div
        className={`platform-launcher-fab ${className} ${isOpen ? 'open' : ''}`}
        initial={false}
      >
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.button
              key="fab-closed"
              className="fab-trigger"
              onClick={() => setIsOpen(true)}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Open platform menu"
              aria-expanded={isOpen}
              aria-controls="platform-fab-menu"
            >
              <MusicIcon size={24} />
            </motion.button>
          ) : (
            <motion.div
              key="fab-open"
              className="fab-menu"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              id="platform-fab-menu"
              role="menu"
            >
              <button
                className="fab-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close platform menu"
              >
                <CloseIcon size={20} />
              </button>
              <div className="fab-platforms">
                {platforms.map((link, index) => (
                  <motion.button
                    key={link.platform}
                    className="fab-platform-btn"
                    onClick={() => handlePlatformClick(link)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { delay: index * 0.05 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      '--platform-color': getPlatformColor(link.platform)
                    } as React.CSSProperties}
                    aria-label={link.label.replace('Listen on ', '').replace('Follow on ', '')}
                    role="menuitem"
                  >
                    <PlatformIcon
                      platform={link.platform}
                      size={28}
                      className="fab-platform-icon-svg"
                      color="white"
                    />
                    {/* Tooltip shown on hover/focus for labels */}
                    <span className="fab-platform-tooltip">
                      {link.label.replace('Listen on ', '').replace('Follow on ', '')}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Backdrop when FAB is open (mobile + desktop) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fab-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default PlatformLauncher;
