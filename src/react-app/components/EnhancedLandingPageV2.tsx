import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useScroll } from 'framer-motion';

import HeroSection from './sections/HeroSection';
import StatsSection from './sections/StatsSection';
import AboutSection from './sections/AboutSection';
import ServicesSection from './sections/ServicesSection';
import PlatformLauncher from './PlatformLauncher';
import CreatorMediaPanel from './CreatorMediaPanel';
import MobileBottomNav from './MobileBottomNav';
import EventGrid from './events/EventGrid';
import NextEventBanner from './events/NextEventBanner';
import { isMobileDevice } from '../utils/platformDetection';
import { navigate } from '../utils/nav';
import logoImage from '../assets/images/logo.jpeg';

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

        {/* Booking CTA to dedicated page */}
        <section id="booking" className="booking-section">
          <div className="container">
            <h2 className="section-title">Book Us</h2>
            <p className="section-subtitle" style={{ marginBottom: '1rem' }}>Quick form. Friendly follow-up within 24 hours.</p>
            <button className="submit-button" onClick={() => navigate('/book')}>Open Booking Form</button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-info">
              <img src={logoImage} alt="DJ Lee & Voices of Judah" className="footer-logo" style={{ maxWidth: '200px', marginBottom: '1rem' }} />
              <h3>DJ Lee & Voices of Judah</h3>
              <p>Spreading the Gospel Through Music</p>
            </div>
            <div className="footer-links">
              <a href="#about">About</a>
              <a href="#music">Music</a>
              <a href="#services">Services</a>
              <a href="/book" data-nav>Contact</a>
            </div>
            <div className="footer-social">
              <p>Follow us on social media</p>
              {/* Avoid duplicating the Connect & Listen block: it's already rendered above for desktop
                  and available via FAB on mobile. Omit inline launcher here. */}
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} DJ Lee & Voices of Judah. All rights reserved.</p>
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
