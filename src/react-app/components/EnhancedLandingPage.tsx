import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Calendar, Music, Users, Award, ChevronUp } from 'lucide-react';
import MusicPlayer from './MusicPlayer';
import PhotoGallery from './PhotoGallery';
import BookingForm from './BookingForm';
import ThemeToggle from './ThemeToggle';
import './EnhancedLandingPage.css';

const EnhancedLandingPage: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  
  // Animation refs
  const [heroRef, heroInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [statsRef, statsInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [aboutRef, aboutInView] = useInView({ threshold: 0.1, triggerOnce: true });

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stats = [
    { icon: Calendar, value: '16+', label: 'Years of Ministry' },
    { icon: Music, value: '4+', label: 'Released Singles' },
    { icon: Users, value: '1.6K+', label: 'Facebook Followers' },
    { icon: Award, value: '2020-2022', label: 'Latest Releases' }
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="enhanced-landing-page">
      <ThemeToggle />
      
      {/* Enhanced Header */}
      <header className="enhanced-header">
        <nav className="container">
          <div className="logo">DJ Lee & Voices of Judah</div>
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
          <ul className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <li><a href="#home" onClick={handleNavClick}>Home</a></li>
            <li><a href="#about" onClick={handleNavClick}>About</a></li>
            <li><a href="#music" onClick={handleNavClick}>Music</a></li>
            <li><a href="#gallery" onClick={handleNavClick}>Gallery</a></li>
            <li><a href="#services" onClick={handleNavClick}>Services</a></li>
            <li><a href="#booking" onClick={handleNavClick}>Book Us</a></li>
          </ul>
        </nav>
      </header>

      {/* Enhanced Hero Section */}
      <section id="home" className="enhanced-hero" ref={heroRef}>
        <motion.div 
          className="hero-background"
          style={{ y: heroY }}
        >
          <div className="particles"></div>
        </motion.div>
        
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 50 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={heroInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            DJ Lee
          </motion.h1>
          <motion.div 
            className="subtitle"
            initial={{ opacity: 0, x: -50 }}
            animate={heroInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            & Voices of Judah
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            Gary, Indiana Gospel Choir • Ministering Through Music Since 2008
          </motion.p>
          <motion.div 
            className="location"
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 1 }}
          >
            Gary, Indiana • Est. 2008
          </motion.div>
          <motion.div 
            className="cta-buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <a href="#music" className="cta-button">Listen Now</a>
            <a href="#booking" className="cta-button secondary">Book Event</a>
          </motion.div>
        </motion.div>

        <motion.div 
          className="scroll-indicator"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span>↓</span>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="stats-section" ref={statsRef}>
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="stat-card"
                initial={{ opacity: 0, y: 30 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="stat-icon">
                  <stat.icon size={32} />
                </div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced About Section */}
      <section id="about" className="enhanced-about" ref={aboutRef}>
        <div className="container">
          <motion.div 
            className="about-content"
            initial={{ opacity: 0 }}
            animate={aboutInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="about-text">
              <h2>Our Story</h2>
              <p>DJ Lee & The Voices of Judah was established in 2008 in Gary, Indiana, when DJ Lee was given the opportunity to form a gospel choir within his high school. What began as a high school choir has evolved into a powerful ministry that continues to touch hearts through anointed worship.</p>
              <p>Under the leadership of DJ Lee, our choir has been blessed to minister God's love through song, creating music that uplifts, heals, and draws people closer to the Lord.</p>
              <div className="about-features">
                <div className="feature">
                  <span className="feature-icon">✓</span>
                  <span>Traditional Gospel Roots</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">✓</span>
                  <span>Contemporary Worship</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">✓</span>
                  <span>Community Impact</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">✓</span>
                  <span>Youth Development</span>
                </div>
              </div>
            </div>
            <div className="about-visual">
              <motion.div 
                className="visual-content"
                animate={{ 
                  backgroundPosition: ['0% 0%', '100% 100%'],
                }}
                transition={{ 
                  duration: 20,
                  repeat: Infinity,
                  repeatType: 'reverse'
                }}
              >
                <span>Worship<br/>Ministry<br/>Transformation</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Music Player Section */}
      <section id="music" className="music-section">
        <div className="container">
          <h2>Experience Our Music</h2>
          <p className="section-subtitle">Listen to our latest recordings and live performances</p>
          <MusicPlayer />
        </div>
      </section>

      {/* Photo Gallery Section */}
      <section id="gallery" className="gallery-section">
        <div className="container">
          <PhotoGallery />
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="enhanced-services">
        <div className="container">
          <h2>Ministry Services</h2>
          <div className="services-grid">
            {[
              { title: 'Church Services', desc: 'Anointed worship for Sunday services and revivals', icon: '🎤' },
              { title: 'Special Events', desc: 'Weddings, funerals, and community celebrations', icon: '🎵' },
              { title: 'Youth Programs', desc: 'Inspiring high school and youth choirs', icon: '🎼' },
              { title: 'Gospel Concerts', desc: 'Dynamic performances throughout Indiana', icon: '🎙️' },
              { title: 'Community Outreach', desc: 'Ministry in Gary and surrounding areas', icon: '🎊' },
              { title: 'Recording', desc: 'Original gospel music and collaborations', icon: '👥' }
            ].map((service, index) => (
              <motion.div
                key={index}
                className="service-card"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(255, 105, 180, 0.3)' }}
              >
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section id="booking" className="booking-section">
        <div className="container">
          <BookingForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="enhanced-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>DJ Lee & Voices of Judah</h4>
              <p>Ministering through music since 2008</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <a href="#about">About Us</a>
              <a href="#music">Our Music</a>
              <a href="#gallery">Gallery</a>
              <a href="#booking">Book Us</a>
            </div>
            <div className="footer-section">
              <h4>Connect</h4>
              <a href="mailto:V.O.J@icloud.com">Email Booking</a>
              <a href="https://www.facebook.com/MidWestScreamers/" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="https://instagram.com/dj_voj" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href="https://soundcloud.com/dj-lee-voices-of-judah" target="_blank" rel="noopener noreferrer">SoundCloud</a>
            </div>
            <div className="footer-section">
              <h4>Listen</h4>
              <a href="https://open.spotify.com/search/dj%20lee%20voices%20of%20judah" target="_blank" rel="noopener noreferrer">Spotify</a>
              <a href="https://music.apple.com/search?term=dj%20lee%20voices%20of%20judah" target="_blank" rel="noopener noreferrer">Apple Music</a>
              <a href="https://music.amazon.com/search/dj+lee+voices+of+judah" target="_blank" rel="noopener noreferrer">Amazon Music</a>
              <a href="https://soundcloud.com/dj-lee-voices-of-judah" target="_blank" rel="noopener noreferrer">SoundCloud</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 DJ Lee & Voices of Judah. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <motion.button
        className="scroll-to-top"
        onClick={scrollToTop}
        initial={{ opacity: 0 }}
        animate={{ opacity: showScrollToTop ? 1 : 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronUp size={24} />
      </motion.button>
    </div>
  );
};

export default EnhancedLandingPage;