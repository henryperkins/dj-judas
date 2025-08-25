import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Calendar, Music, Users, Award, ChevronUp } from 'lucide-react';
import MusicHub from './MusicHub';
import PhotoGallery from './PhotoGallery';
import BookingForm from './BookingForm';
import ThemeToggle from './ThemeToggle';
import SocialProofWall from './SocialProofWall';
import FacebookHub from './FacebookHub';
import InstagramHub from './InstagramHub';
// styles consolidated into src/react-app/styles.css

const EnhancedLandingPage: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('home');
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

  // Active section highlighting
  useEffect(() => {
    const ids = ['home', 'about', 'music', 'social', 'gallery', 'services', 'booking'];
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Choose the most visible entry
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
        if (visible && visible.target.id) {
          setActiveSection(visible.target.id);
        }
      },
      { root: null, rootMargin: '0px 0px -60% 0px', threshold: [0.1, 0.25, 0.5, 0.75, 1] },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
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
      <a href="#main" className="skip-link">Skip to content</a>
      <ThemeToggle />
      
      {/* Enhanced Header */}
      <header className="enhanced-header">
        <nav className="container">
          <div className="logo">DJ Lee & Voices of Judah</div>
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="primary-nav"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
          <ul id="primary-nav" className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <li><a href="#home" onClick={handleNavClick} className={activeSection==='home' ? 'active' : ''} aria-current={activeSection==='home' ? 'page' : undefined}>Home</a></li>
            <li><a href="#about" onClick={handleNavClick} className={activeSection==='about' ? 'active' : ''} aria-current={activeSection==='about' ? 'page' : undefined}>About</a></li>
            <li><a href="#music" onClick={handleNavClick} className={activeSection==='music' ? 'active' : ''} aria-current={activeSection==='music' ? 'page' : undefined}>Music</a></li>
            <li><a href="#social" onClick={handleNavClick} className={activeSection==='social' ? 'active' : ''} aria-current={activeSection==='social' ? 'page' : undefined}>Connect</a></li>
            <li><a href="#gallery" onClick={handleNavClick} className={activeSection==='gallery' ? 'active' : ''} aria-current={activeSection==='gallery' ? 'page' : undefined}>Gallery</a></li>
            <li><a href="#services" onClick={handleNavClick} className={activeSection==='services' ? 'active' : ''} aria-current={activeSection==='services' ? 'page' : undefined}>Services</a></li>
            <li><a href="#booking" onClick={handleNavClick} className={activeSection==='booking' ? 'active' : ''} aria-current={activeSection==='booking' ? 'page' : undefined}>Book Us</a></li>
          </ul>
        </nav>
      </header>

      <main id="main" tabIndex={-1}>
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

      {/* Social Proof Wall */}
      <section className="social-proof-section">
        <div className="container">
          <SocialProofWall 
            spotifyMonthlyListeners={850}
            appleMusicPlays={1200}
            facebookFollowers={1600}
            instagramFollowers={2300}
            totalStreams={15000}
            showLiveMetrics={true}
            featuredTestimonial={{
              text: "Their music touches the soul and brings people closer to God. A truly anointed ministry!",
              author: "Community Member",
              platform: "Facebook"
            }}
          />
        </div>
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

      {/* Music Hub Section */}
      <section id="music" className="music-section">
        <div className="container">
          <MusicHub 
            tracks={[
              {
                id: '1',
                title: 'I Love to Praise Him',
                artist: 'DJ Lee & Voices of Judah',
                spotifyUri: 'spotify:track:4gXPNZiP6QXLzkJQP0m9CK',
                appleMusicUrl: 'https://music.apple.com/us/album/i-love-to-praise-him/1532345678',
                releaseDate: '2020'
              },
              {
                id: '2',
                title: 'Starting Point',
                artist: 'DJ Lee & Voices of Judah',
                spotifyUri: 'spotify:track:5HKzPNZiP6QXLzkJQP1m8D',
                appleMusicUrl: 'https://music.apple.com/us/album/starting-point/1532345679',
                releaseDate: '2021'
              },
              {
                id: '3',
                title: 'Celebrate (feat. Christina Chelley Lindsey)',
                artist: 'DJ Lee & Voices of Judah',
                spotifyUri: 'spotify:track:6IJzPNZiP6QXLzkJQP2n7E',
                appleMusicUrl: 'https://music.apple.com/us/album/celebrate/1532345680',
                releaseDate: '2021'
              },
              {
                id: '4',
                title: 'Great & Mighty (feat. Larry Jones)',
                artist: 'DJ Lee & Voices of Judah',
                spotifyUri: 'spotify:track:7JKzPNZiP6QXLzkJQP3o6F',
                appleMusicUrl: 'https://music.apple.com/us/album/great-mighty/1532345681',
                releaseDate: '2022'
              },
              {
                id: '5',
                title: "King's Motorcade",
                artist: 'DJ Lee & Voices of Judah',
                spotifyUri: 'spotify:track:8KLzPNZiP6QXLzkJQP4p5G',
                appleMusicUrl: 'https://music.apple.com/us/album/kings-motorcade/1532345682',
                releaseDate: '2022'
              }
            ]}
            featuredTrackId="1"
          />
        </div>
      </section>

      {/* Social Media Section */}
      <section id="social" className="social-media-section">
        <div className="container">
          <h2>Connect With Us</h2>
          <p className="section-subtitle">Follow our journey on social media</p>
          
          <div className="social-grid">
            <div className="facebook-container">
              <FacebookHub 
                pageUrl="https://www.facebook.com/MidWestScreamers/"
                showMusicCTA={true}
                spotifyArtistId="YOUR_SPOTIFY_ARTIST_ID"
                appleMusicArtistUrl="https://music.apple.com/artist/YOUR_ARTIST_ID"
                upcomingEvents={[
                  {
                    title: "Sunday Worship Service",
                    date: "Every Sunday",
                    location: "Gary, Indiana"
                  }
                ]}
              />
            </div>
            
            <div className="instagram-container">
              <InstagramHub 
                posts={[
                  {
                    url: "https://www.instagram.com/p/YOUR_POST_ID_1/",
                    type: "post",
                    caption: "Ministry moments",
                    engagement: { likes: 150, comments: 25, saves: 30 }
                  },
                  {
                    url: "https://www.instagram.com/p/YOUR_POST_ID_2/",
                    type: "reel",
                    caption: "Performance highlights",
                    musicTrack: "I Love to Praise Him",
                    engagement: { likes: 320, comments: 45, saves: 60 }
                  }
                ]}
                profileUrl="https://instagram.com/dj_voj"
                spotifyPlaylistUrl="https://open.spotify.com/playlist/YOUR_PLAYLIST_ID"
                appleMusicPlaylistUrl="https://music.apple.com/playlist/YOUR_PLAYLIST_ID"
                showMusicDiscovery={true}
              />
            </div>
          </div>
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

      </main>

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
            </div>
            <div className="footer-section">
              <h4>Listen</h4>
              <a href="https://open.spotify.com/search/dj%20lee%20voices%20of%20judah" target="_blank" rel="noopener noreferrer">Spotify</a>
              <a href="https://music.apple.com/search?term=dj%20lee%20voices%20of%20judah" target="_blank" rel="noopener noreferrer">Apple Music</a>
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
