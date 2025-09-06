import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuHouse, LuMusic, LuCalendar, LuShare2, LuTicket } from 'react-icons/lu';
import { isMobileDevice } from '../utils/platformDetection';
import { navigate } from '../utils/nav';


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
    icon: LuHouse,
    label: 'Home',
    href: '#home'
  },
  {
    id: 'listen',
    icon: LuMusic,
    label: 'Listen',
    action: () => {} // Will be overridden by onPlatformLauncherOpen
  },
  {
    id: 'events',
    icon: LuCalendar,
    label: 'Events',
    href: '#events'
  },
  {
    id: 'book',
    icon: LuTicket,
    label: 'Book',
    action: () => navigate('/book')
  },
  {
    id: 'share',
    icon: LuShare2,
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
  const listRef = useRef<HTMLUListElement | null>(null);

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
    // Map section ids to nav ids where needed (media -> listen)
    const mapped = activeItem === 'media' ? 'listen' : activeItem;
    setCurrentActive(mapped);
  }, [activeItem]);

  useEffect(() => {
    if (isMobile || showOnDesktop) {
      if (isVisible) {
        document.body.classList.add('mobile-nav-visible');
      } else {
        document.body.classList.remove('mobile-nav-visible');
      }
    } else {
      document.body.classList.remove('mobile-nav-visible');
    }

    return () => {
      document.body.classList.remove('mobile-nav-visible');
    };
  }, [isVisible, isMobile, showOnDesktop]);

  const handleItemClick = (item: NavItem) => {
    if (item.id === 'listen') {
      // Prefer lifting to parent callback when provided
      if (onPlatformLauncherOpen) {
        onPlatformLauncherOpen();
      }
      // Also emit a lightweight custom event so PlatformLauncher can react
      // without requiring parent wiring, keeping pages decoupled.
      try {
        window.dispatchEvent(new Event('platform-launcher:open'));
      } catch (e) {
        // no-op if not in browser
      }
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

  // Roving tabindex + arrow key navigation
  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(e.key)) return;
    const container = listRef.current;
    if (!container) return;
    const items = Array.from(container.querySelectorAll<HTMLButtonElement>(".nav-item"));
    if (items.length === 0) return;
    const activeIndex = Math.max(0, items.findIndex((el) => el.getAttribute("aria-current") === "page"));
    let nextIndex = activeIndex;
    if (e.key === "ArrowRight") nextIndex = (activeIndex + 1) % items.length;
    if (e.key === "ArrowLeft") nextIndex = (activeIndex - 1 + items.length) % items.length;
    if (e.key === "Home") nextIndex = 0;
    if (e.key === "End") nextIndex = items.length - 1;
    const next = items[nextIndex];
    next?.focus();
    const id = next?.dataset?.id;
    if (id) setCurrentActive(id);
    e.preventDefault();
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
            role="navigation"
            aria-label="Primary"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <ul
              ref={listRef}
              className="nav-container nav-list"
              onKeyDown={onKeyDown}
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentActive === item.id;

                const ariaControls = item.href && item.href.startsWith('#') ? item.href.slice(1) : undefined;
                return (
                  <li className="nav-li" key={item.id}>
                    <motion.button
                      data-id={item.id}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleItemClick(item)}
                      whileTap={{ scale: 0.9 }}
                      aria-label={item.label}
                      aria-current={isActive ? 'page' : undefined}
                      aria-controls={ariaControls}
                      tabIndex={isActive ? 0 : -1}
                    >
                      <motion.div
                        className="nav-item-content"
                        animate={isActive ? { y: -2 } : { y: 0 }}
                      >
                        <div className="nav-icon-wrapper" aria-hidden="true">
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
                            aria-hidden="true"
                          />
                        )}
                      </motion.div>
                    </motion.button>
                  </li>
                );
              })}
            </ul>
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
            role="status"
            aria-live="polite"
          >
            <span>Link copied to clipboard!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileBottomNav;
