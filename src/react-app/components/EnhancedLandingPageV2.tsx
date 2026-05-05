import React, { lazy, Suspense, useEffect, useState } from 'react';

import HeroSection from './sections/HeroSection';
import StatsSection from './sections/StatsSection';
import AboutSection from './sections/AboutSection';
import ServicesSection from './sections/ServicesSection';
import PlatformLauncher from './PlatformLauncher';
import MobileBottomNav from './MobileBottomNav';
// Lazy-load heavier sections to reduce main chunk
const CreatorMediaPanel = lazy(() => import('./CreatorMediaPanel'));
const FeaturedProducts = lazy(() => import('./FeaturedProducts'));
const NextEventBanner = lazy(() => import('./events/NextEventBanner'));
const DynamicSocialFeed = lazy(() => import('./social/feeds/DynamicSocialFeed'));
const EventGrid = lazy(() => import('./events/EventGrid'));
import { isMobileViewport } from '../utils/platformDetection';
import { navigate } from '../utils/nav';
import { getPlatformWebLink } from '../config/platforms';
import logoImage from '../assets/images/logo.jpeg';
import { Button } from '@/components/ui/button';

 // Lazy load heavy components
const PhotoGallery = lazy(() => import('./PhotoGallery'));
// Social section removed

const LoadingFallback = () => (
  <div className="embed-skeleton" role="status" aria-live="polite">
    <div className="skeleton-pulse" />
    <span className="sr-only">Loading…</span>
  </div>
);

const EnhancedLandingPageV2: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [socialFeedAvailable, setSocialFeedAvailable] = useState<boolean | null>(null);
  const appleMusicArtistUrl = getPlatformWebLink('appleMusic');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileViewport());
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Track active section for mobile nav
  useEffect(() => {
    const sections = ['home', 'events', 'media', 'social', 'gallery', 'services', 'booking'];
    let frame: number | null = null;

    const updateActiveSection = () => {
      frame = null;
      const anchor = window.innerHeight * 0.5;
      let best: { id: string; distance: number } | null = null;

      for (const id of sections) {
        const element = document.getElementById(id);
        if (!element) continue;

        const rect = element.getBoundingClientRect();
        if (rect.height <= 0 || rect.bottom < 0 || rect.top > window.innerHeight) continue;

        const distance = rect.top <= anchor && rect.bottom >= anchor
          ? 0
          : Math.min(Math.abs(rect.top - anchor), Math.abs(rect.bottom - anchor));

        if (!best || distance < best.distance) {
          best = { id, distance };
        }
      }

      if (best) {
        setActiveSection(best.id);
      }
    };

    const scheduleUpdate = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(updateActiveSection);
    };

    scheduleUpdate();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    const mutationObserver = new MutationObserver(scheduleUpdate);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      mutationObserver.disconnect();
    };
  }, []);

  const handlePlatformLauncherOpen = () => {
    try {
      window.dispatchEvent(new Event('platform-launcher:open'));
    } catch {
      // no-op
    }
  };

  return (
    <div className="enhanced-landing-page-v2">
      <a href="#main" className="skip-link">Skip to content</a>

      {/* Hero Section */}
      <section id="home" aria-labelledby="hero-heading">
        <HeroSection />
      </section>

      <main id="main" tabIndex={-1}>
        {/* Next Event Banner */}
        <Suspense fallback={<LoadingFallback />}>
          <NextEventBanner />
        </Suspense>

        {/* Events Section first for quick access */}
        <Suspense fallback={<LoadingFallback />}>
          <EventGrid />
        </Suspense>

        {/* Stats Section moved below events */}
        <StatsSection />

        {/* Platform Launcher - Inline for desktop, FAB for mobile */}

        {!isMobile && (
          <section className="platform-section">
            <div className="container">
              <PlatformLauncher mode="inline" simplified={false} />
            </div>
          </section>
        )}

        {/* About Section */}
        <AboutSection />

        {/* Creator Media Panel - Modern unified interface */}
        <section id="media" className="media-section">
          <div className="container">
            <Suspense fallback={<LoadingFallback />}>
              <CreatorMediaPanel
              artist="DJ Lee & The Voices of Judah"
              tagline="Gospel Ministry from Gary, Indiana • Established 2008"
              // Actual music content
              spotifyUrl="https://open.spotify.com/embed/artist/5WICYLl8MXvOY2x3mkoSqK" // DJ Lee & Voices of Judah artist page
              appleMusicUrl={appleMusicArtistUrl}
              // Social media - actual verified accounts
              facebookPageUrl="https://www.facebook.com/MidWestScreamers/"
              // Sample public video for demo purposes
              facebookVideoHref="https://www.facebook.com/facebookapp/videos/10153231379946729/"
              instagramPermalink="https://www.instagram.com/iam_djlee/"
              // Additional content can be added here as needed
              />
            </Suspense>
          </div>
        </section>


        {/* Dynamic Social Feed - New shoppable posts and events */}
        <section id="social" className="social-section">
          <div className="container">
            <h2 className="section-title">Latest Updates</h2>
            <p className="section-subtitle">Follow our journey on social media</p>
            
            {/* Shoppable Instagram Feed */}
            <div className="social-feed-wrapper">
              <Suspense fallback={<LoadingFallback />}>
                <DynamicSocialFeed 
                  platforms={['instagram']}
                  layout="grid"
                  limit={6}
                  enableShoppable={true}
                  autoRefresh={true}
                  refreshInterval={300}
                  onAvailabilityChange={setSocialFeedAvailable}
                />
              </Suspense>
            </div>

            {socialFeedAvailable === false && (
              <div className="social-fallback">
                <p className="social-fallback__title">Instagram updates are available off-site.</p>
                <p className="social-fallback__description">
                  Follow the ministry for new photos, reels, and announcements.
                </p>
              </div>
            )}
            
            {/* Follow CTA */}
            <div className="social-cta">
              <Button 
                variant="outline"
                onClick={() => {
                  const handle = (import.meta.env?.VITE_INSTAGRAM_HANDLE as string | undefined) || 'iam_djlee';
                  const url = `https://www.instagram.com/${handle}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="view-all-social"
                aria-label="Open Instagram profile in a new tab"
              >
                Follow on Instagram
              </Button>
            </div>
          </div>
        </section>

        {/* Gallery Section - Lazy loaded */}
        <section id="gallery" className="gallery-section">
          <div className="container">
            <h2 className="section-title">Photo Gallery</h2>
            <Suspense fallback={<LoadingFallback />}>
              <PhotoGallery />
            </Suspense>
          </div>
        </section>

        {/* Services Section */}
        <ServicesSection />

        {/* Featured Products (Medusa) */}
        <Suspense fallback={<LoadingFallback />}>
          <FeaturedProducts />
        </Suspense>

        {/* Booking CTA - Minimal mobile-first design */}
        <section id="booking" className="booking-section-minimal">
          <div className="container">
            <div className="booking-content">
              <h2 className="booking-title">Book Us</h2>
              <p className="booking-subtitle">Quick form • 24hr response</p>
              <Button 
                className="booking-cta-button" 
                onClick={() => navigate('/book')}
                aria-label="Open booking form"
              >
                Start Booking
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Mobile-first minimal design */}
      <footer className="site-footer-minimal">
        <div className="container">
          <div className="footer-main">
            {/* Logo and brand */}
            <div className="footer-brand">
              <img 
                src={logoImage} 
                alt="DJ Lee & Voices of Judah" 
                className="footer-logo" 
                loading="lazy"
              />
              <h3 className="footer-title">DJ Lee & Voices of Judah</h3>
              <p className="footer-tagline">Gospel Ministry • Est. 2008</p>
            </div>

            {/* Quick links - horizontal on mobile */}
            <nav className="footer-nav" aria-label="Footer navigation">
              <a href="#about" className="footer-link">About</a>
              <a href="#media" className="footer-link">Media</a>
              <a href="#services" className="footer-link">Services</a>
              <a href="/book" data-nav className="footer-link">Book</a>
              {(() => {
                const medusaAdminUrl = (import.meta.env?.VITE_MEDUSA_ADMIN_URL as string | undefined) || undefined;
                const medusaUrl = (import.meta.env?.VITE_MEDUSA_URL as string | undefined) || undefined;
                const computed = medusaAdminUrl || (medusaUrl ? `${medusaUrl.replace(/\/$/, '')}/app` : '/admin');
                const isExternal = /^https?:\/\//i.test(computed);
                return isExternal ? (
                  <a
                    href={computed}
                    className="footer-link"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open Medusa Admin in a new tab"
                  >
                    Admin
                  </a>
                ) : (
                  <a href={computed} data-nav className="footer-link">Admin</a>
                );
              })()}
            </nav>
          </div>

          {/* Copyright - minimal */}
          <div className="footer-bottom">
            <p className="footer-copyright">
              © {new Date().getFullYear()} DJ Lee & VOJ
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile-specific components */}
      {isMobile && (
        <>
          <PlatformLauncher
            mode="floating"
            simplified={true}
          />
          <MobileBottomNav
            activeItem={activeSection}
            onPlatformLauncherOpen={handlePlatformLauncherOpen}
          />
        </>
      )}
    </div>
  );
};

export default EnhancedLandingPageV2;
