import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, X, ExternalLink } from 'lucide-react';
import {
  generatePlatformLinks,
  openPlatform,
  trackPlatformClick,
  isMobileDevice,
  PLATFORM_CONFIGS,
  type PlatformLink
} from '../utils/platformDetection';
import './PlatformLauncher.css';

export interface PlatformLauncherProps {
  mode?: 'floating' | 'inline' | 'modal';
  simplified?: boolean;
  className?: string;
  onPlatformClick?: (platform: string) => void;
}

const PlatformLauncher: React.FC<PlatformLauncherProps> = ({
  mode = 'floating',
  simplified = true,
  className = '',
  onPlatformClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [platforms] = useState<PlatformLink[]>(generatePlatformLinks());

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice());
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const getPlatformColor = (platform: string): string => {
    switch (platform) {
      case 'spotify':
        return PLATFORM_CONFIGS.spotify.color;
      case 'apple-music':
        return PLATFORM_CONFIGS.appleMusic.color;
      case 'facebook':
        return PLATFORM_CONFIGS.facebook.color;
      case 'instagram':
        return PLATFORM_CONFIGS.instagram.color;
      default:
        return '#000';
    }
  };

  const getPlatformIcon = (platform: string): string => {
    switch (platform) {
      case 'spotify':
        return PLATFORM_CONFIGS.spotify.icon;
      case 'apple-music':
        return PLATFORM_CONFIGS.appleMusic.icon;
      case 'facebook':
        return PLATFORM_CONFIGS.facebook.icon;
      case 'instagram':
        return PLATFORM_CONFIGS.instagram.icon;
      default:
        return '🎵';
    }
  };

  if (mode === 'inline') {
    return (
      <div className={`platform-launcher-inline ${className}`}>
        <h3 className="platform-launcher-title">Connect & Listen</h3>
        <div className="platform-grid">
          {platforms.map((link) => (
            <motion.button
              key={link.platform}
              className="platform-card"
              onClick={() => handlePlatformClick(link)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                '--platform-color': getPlatformColor(link.platform)
              } as React.CSSProperties}
            >
              <span className="platform-icon">{getPlatformIcon(link.platform)}</span>
              <span className="platform-name">{link.label}</span>
              <ExternalLink className="platform-external-icon" size={16} />
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
                <X size={24} />
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
                    <span className="platform-modal-icon">
                      {getPlatformIcon(link.platform)}
                    </span>
                    <span className="platform-modal-name">{link.label}</span>
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
            >
              <Music size={24} />
            </motion.button>
          ) : (
            <motion.div
              key="fab-open"
              className="fab-menu"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <button
                className="fab-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close platform menu"
              >
                <X size={20} />
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
                  >
                    <span className="fab-platform-icon">
                      {getPlatformIcon(link.platform)}
                    </span>
                    <span className="fab-platform-label">
                      {link.label.replace('Listen on ', '').replace('Follow on ', '')}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Backdrop for mobile when FAB is open */}
      <AnimatePresence>
        {isOpen && isMobile && (
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