import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
  const shouldReduceMotion = useReducedMotion();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const shouldRestoreFocusRef = useRef(false);

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

  useEffect(() => {
    if (!isOpen || mode !== 'floating') return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const focusTimeout = window.setTimeout(() => closeRef.current?.focus(), 50);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        shouldRestoreFocusRef.current = true;
        setIsOpen(false);
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = menuRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(focusTimeout);
      document.removeEventListener('keydown', handleKeyDown);
      if (document.activeElement === document.body) {
        previousFocus?.focus();
      }
    };
  }, [isOpen, mode]);

  useEffect(() => {
    if (isOpen || mode !== 'floating' || !shouldRestoreFocusRef.current) return;

    const focusTrigger = () => {
      if (!triggerRef.current) return;
      triggerRef.current.focus();
      shouldRestoreFocusRef.current = false;
    };
    const frame = window.requestAnimationFrame(focusTrigger);
    const focusTimeout = window.setTimeout(focusTrigger, 350);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(focusTimeout);
    };
  }, [isOpen, mode]);

  const setTriggerRef = (node: HTMLButtonElement | null) => {
    triggerRef.current = node;
    if (!node || !shouldRestoreFocusRef.current) return;
    window.requestAnimationFrame(() => {
      node.focus();
      shouldRestoreFocusRef.current = false;
    });
  };

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
      openPlatform(link);
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
              whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
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
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0 }}
              transition={shouldReduceMotion ? { duration: 0 } : undefined}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="platform-launcher-modal"
              initial={shouldReduceMotion ? false : { scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={shouldReduceMotion ? undefined : { scale: 0.9, opacity: 0 }}
              transition={shouldReduceMotion ? { duration: 0 } : undefined}
            >
              <button
                className="platform-modal-close"
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
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
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
        className={`platform-launcher platform-launcher--fab ${className} ${isOpen ? 'platform-launcher--open' : ''}`}
        initial={false}
      >
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.button
              ref={setTriggerRef}
              key="fab-closed"
              className="platform-launcher__fab-trigger"
              onClick={() => setIsOpen(true)}
              initial={shouldReduceMotion ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              exit={shouldReduceMotion ? undefined : { scale: 0 }}
              transition={shouldReduceMotion ? { duration: 0 } : undefined}
              whileHover={shouldReduceMotion ? undefined : { scale: 1.1 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
              aria-label="Open platform menu"
              aria-expanded={isOpen}
              aria-controls="platform-fab-menu"
            >
              <MusicIcon size={24} />
            </motion.button>
          ) : (
            <motion.div
              ref={menuRef}
              key="fab-open"
              className="platform-launcher__fab-menu"
              initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={shouldReduceMotion ? undefined : { scale: 0, opacity: 0 }}
              transition={shouldReduceMotion ? { duration: 0 } : undefined}
              onAnimationComplete={() => closeRef.current?.focus()}
              id="platform-fab-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Streaming and social platforms"
            >
              <button
                ref={closeRef}
                className="platform-launcher__fab-close"
                autoFocus
                onClick={() => {
                  shouldRestoreFocusRef.current = true;
                  setIsOpen(false);
                }}
                aria-label="Close platform menu"
              >
                <CloseIcon size={20} />
              </button>
              <div className="platform-launcher__fab-platforms">
                {platforms.map((link, index) => (
                  <motion.button
                    key={link.platform}
                    className="platform-launcher__fab-button"
                    onClick={() => handlePlatformClick(link)}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: shouldReduceMotion ? { duration: 0 } : { delay: index * 0.05 }
                    }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                    style={{
                      '--platform-color': getPlatformColor(link.platform)
                    } as React.CSSProperties}
                    aria-label={link.label.replace('Listen on ', '').replace('Follow on ', '')}
                  >
                    <PlatformIcon
                      platform={link.platform}
                      size={28}
                      className="platform-launcher__fab-icon"
                      color="white"
                    />
                    {/* Tooltip shown on hover/focus for labels */}
                    <span className="platform-launcher__fab-tooltip">
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
            className="platform-launcher__fab-backdrop"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : undefined}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default PlatformLauncher;
