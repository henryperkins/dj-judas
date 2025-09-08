import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useScroll } from 'framer-motion';

import HeroSection from './sections/HeroSection';
import StatsSection from './sections/StatsSection';
import AboutSection from './sections/AboutSection';
import ServicesSection from './sections/ServicesSection';
import PlatformLauncher from './PlatformLauncher';
import CreatorMediaPanel from './CreatorMediaPanel';
import FeaturedProducts from './FeaturedProducts';
import MobileBottomNav from './MobileBottomNav';
import EventGrid from './events/EventGrid';
import NextEventBanner from './events/NextEventBanner';
import { isMobileDevice } from '../utils/platformDetection';
import { navigate } from '../utils/nav';
import logoImage from '../assets/images/logo.jpeg';
import { Button } from '@/components/ui/button';

 // Lazy load heavy components
const PhotoGallery = lazy(() => import('./PhotoGallery'));
// Social section removed

const LoadingFallback = () => (
  <div className="loading-section">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
);

const EnhancedLandingPageV2: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [, setPlatformLauncherOpen] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice());
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Track active section for mobile nav
  useEffect(() => {
    // Include 'events' so the Events section can be highlighted/navigated to
    // Use 'media' instead of legacy 'music'
    const sections = ['home', 'about', 'media', 'events', 'gallery', 'services', 'booking'];
    const observers = new Map();

    sections.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                setActiveSection(id);
              }
            });
          },
          { threshold: [0.5] }
        );
        observer.observe(element);
        observers.set(id, observer);
      }
    });

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, []);

  const handlePlatformLauncherOpen = () => {
    setPlatformLauncherOpen(true);
  };

  return (
    <div className="enhanced-landing-page-v2">
      <a href="#main" className="skip-link">Skip to content</a>

      {/* Hero Section */}
      <HeroSection scrollY={scrollY} />

      <main id="main" tabIndex={-1}>
        {/* Next Event Banner */}
        <NextEventBanner />

        {/* Events Section first for quick access */}
        <EventGrid />

        {/* Stats Section moved below events */}
        <StatsSection />

        {/* Platform Launcher - Inline for desktop, FAB for mobile */}

        {!isMobile && (
          <section className="platform-section">
            <div className="container">
              <PlatformLauncher mode="inline" simplified={isMobile} />
            </div>
          </section>
        )}

        {/* About Section */}
        <AboutSection />

        {/* Creator Media Panel - Modern unified interface */}
        <section id="media" className="media-section">
          <div className="container">
            <CreatorMediaPanel
              artist="DJ Lee & The Voices of Judah"
              tagline="Gospel Ministry from Gary, Indiana • Established 2008"
              // Actual music content
              spotifyUrl="https://open.spotify.com/embed/artist/5WICYLl8MXvOY2x3mkoSqK" // DJ Lee & Voices of Judah artist page
              appleMusicUrl="https://music.apple.com/us/artist/dj-lee/18270857"
              // Social media - actual verified accounts
              facebookPageUrl="https://www.facebook.com/MidWestScreamers/"
              // Sample public video for demo purposes
              facebookVideoHref="https://www.facebook.com/facebookapp/videos/10153231379946729/"
              instagramPermalink="https://www.instagram.com/iam_djlee/"
              // Additional content can be added here as needed
            />
          </div>
        </section>


        {/* Social Section removed as per request */}

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
        <FeaturedProducts />

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
            onPlatformClick={() => setPlatformLauncherOpen(false)}
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
