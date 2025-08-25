import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Music, Calendar, Share2 } from 'lucide-react';
import { isMobileDevice } from '../utils/platformDetection';
import './MobileBottomNav.css';

export interface NavItem {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  href?: string;
  action?: () => void;
  badge?: number;
}

export interface MobileBottomNavProps {
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
  onPlatformLauncherOpen?: () => void;
  customItems?: NavItem[];
  showOnDesktop?: boolean;
}

const defaultNavItems: NavItem[] = [
  {
    id: 'home',
    icon: Home,
    label: 'Home',
    href: '#home'
  },
  {
    id: 'listen',
    icon: Music,
    label: 'Listen',
    action: () => {} // Will be overridden by onPlatformLauncherOpen
  },
  {
    id: 'book',
    icon: Calendar,
    label: 'Book',
    href: '#booking'
  },
  {
    id: 'share',
    icon: Share2,
    label: 'Share',
    action: () => {} // Will trigger share functionality
  }
];

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeItem = 'home',
  onItemClick,
  onPlatformLauncherOpen,
  customItems,
  showOnDesktop = false
}) => {
  const [currentActive, setCurrentActive] = useState(activeItem);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  const navItems = customItems || defaultNavItems;

  useEffect(() => {
    const checkMobile = () => {
      const mobile = isMobileDevice();
      setIsMobile(mobile);
      setIsVisible(mobile || showOnDesktop);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [showOnDesktop]);

  useEffect(() => {
    if (!isMobile && !showOnDesktop) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isMobile, showOnDesktop]);

  useEffect(() => {
    setCurrentActive(activeItem);
  }, [activeItem]);

  const handleItemClick = (item: NavItem) => {
    if (item.id === 'listen' && onPlatformLauncherOpen) {
      onPlatformLauncherOpen();
      return;
    }

    if (item.id === 'share') {
      handleShare();
      return;
    }

    setCurrentActive(item.id);
    
    if (onItemClick) {
      onItemClick(item.id);
    }

    if (item.action) {
      item.action();
    } else if (item.href) {
      // Smooth scroll to section
      const target = document.querySelector(item.href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'DJ Lee & Voices of Judah',
      text: 'Check out DJ Lee & Voices of Judah - Gospel music ministry',
      url: window.location.href
    };

    // Check if Web Share API is available
    if (navigator.share && isMobile) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback: Show share menu
      setShareMenuOpen(true);
      setTimeout(() => setShareMenuOpen(false), 3000);
      
      // Copy to clipboard as fallback
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
      }
    }
  };

  if (!isMobile && !showOnDesktop) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.nav
            className="mobile-bottom-nav"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="nav-container">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentActive === item.id;
                
                return (
                  <motion.button
                    key={item.id}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleItemClick(item)}
                    whileTap={{ scale: 0.9 }}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <motion.div
                      className="nav-item-content"
                      animate={isActive ? { y: -2 } : { y: 0 }}
                    >
                      <div className="nav-icon-wrapper">
                        <Icon 
                          size={24} 
                          className="nav-icon"
                        />
                        {item.badge && item.badge > 0 && (
                          <span className="nav-badge">{item.badge}</span>
                        )}
                      </div>
                      <span className="nav-label">{item.label}</span>
                      {isActive && (
                        <motion.div
                          className="nav-indicator"
                          layoutId="nav-indicator"
                          initial={false}
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 30
                          }}
                        />
                      )}
                    </motion.div>
                  </motion.button>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Share Menu Popup */}
      <AnimatePresence>
        {shareMenuOpen && (
          <motion.div
            className="share-popup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <span>Link copied to clipboard!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileBottomNav;