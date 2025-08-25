import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useScroll } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import HeroSection from './sections/HeroSection';
import StatsSection from './sections/StatsSection';
import AboutSection from './sections/AboutSection';
import ServicesSection from './sections/ServicesSection';
import PlatformLauncher from './PlatformLauncher';
import MobileBottomNav from './MobileBottomNav';
import { isMobileDevice } from '../utils/platformDetection';

// Lazy load heavy components
const MusicHub = lazy(() => import('./MusicHub'));
const PhotoGallery = lazy(() => import('./PhotoGallery'));
const BookingForm = lazy(() => import('./BookingForm'));
const SocialProofWall = lazy(() => import('./SocialProofWall'));
const FacebookHub = lazy(() => import('./FacebookHub'));
const InstagramHub = lazy(() => import('./InstagramHub'));

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
    const sections = ['home', 'about', 'music', 'social', 'gallery', 'services', 'booking'];
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
      <ThemeToggle />
      
      {/* Hero Section */}
      <HeroSection scrollY={scrollY} />
      
      {/* Stats Section */}
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
      
      {/* Music Section - Lazy loaded */}
      <section id="music" className="music-section">
        <div className="container">
          <h2 className="section-title">Our Music</h2>
          <Suspense fallback={<LoadingFallback />}>
            {isMobile ? (
              // Simplified music section for mobile
              <div className="mobile-music-cta">
                <p>Experience our gospel music on your favorite platform</p>
                <button 
                  className="btn btn-primary"
                  onClick={handlePlatformLauncherOpen}
                >
                  Open Music Platforms
                </button>
              </div>
            ) : (
              <MusicHub tracks={[]} />
            )}
          </Suspense>
        </div>
      </section>
      
      {/* Social Section - Lazy loaded */}
      <section id="social" className="social-section">
        <div className="container">
          <h2 className="section-title">Connect With Us</h2>
          <Suspense fallback={<LoadingFallback />}>
            <SocialProofWall />
            {!isMobile && (
              <>
                <FacebookHub pageUrl="https://www.facebook.com/djleevoicesofjudah" />
                <InstagramHub posts={[]} profileUrl="https://www.instagram.com/djleevoicesofjudah" />
              </>
            )}
          </Suspense>
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
      
      {/* Booking Section - Lazy loaded */}
      <section id="booking" className="booking-section">
        <div className="container">
          <h2 className="section-title">Book Us</h2>
          <Suspense fallback={<LoadingFallback />}>
            <BookingForm />
          </Suspense>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-info">
              <h3>DJ Lee & Voices of Judah</h3>
              <p>Spreading the Gospel Through Music</p>
            </div>
            <div className="footer-links">
              <a href="#about">About</a>
              <a href="#music">Music</a>
              <a href="#services">Services</a>
              <a href="#booking">Contact</a>
            </div>
            <div className="footer-social">
              <p>Follow us on social media</p>
              <PlatformLauncher mode="inline" simplified={true} />
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