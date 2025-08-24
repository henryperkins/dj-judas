import React, { useEffect, useState } from 'react';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  useEffect(() => {
    // Smooth scrolling for navigation links
    const handleSmoothScroll = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const element = document.querySelector(target.getAttribute('href')!);
        element?.scrollIntoView({ behavior: 'smooth' });
      }
    };

    // Header background on scroll and scroll-to-top button
    const handleScroll = () => {
      const header = document.querySelector('header');
      if (header) {
        if (window.scrollY > 100) {
          header.style.background = 'rgba(0, 0, 0, 0.98)';
          setShowScrollToTop(true);
        } else {
          header.style.background = 'rgba(0, 0, 0, 0.95)';
          setShowScrollToTop(false);
        }
      }
    };

    // Add event listeners
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', handleSmoothScroll);
    });
    
    window.addEventListener('scroll', handleScroll);

    // Cleanup
    return () => {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.removeEventListener('click', handleSmoothScroll);
      });
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleMusicItemHover = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'translateY(-15px) scale(1.02)';
  };

  const handleMusicItemLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'translateY(0) scale(1)';
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="landing-page">
      <header>
        <nav className="container">
          <div 
            className="logo" 
            onClick={scrollToTop} 
            onKeyDown={(e) => handleKeyDown(e, scrollToTop)}
            tabIndex={0}
            role="button"
            aria-label="Go to top of page"
            style={{ cursor: 'pointer' }}
          >
            DJ Lee & Voices of Judah
          </div>
          <button 
            className="mobile-menu-btn"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
          <ul className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <li><a href="#home" onClick={handleNavClick}>Home</a></li>
            <li><a href="#about" onClick={handleNavClick}>About</a></li>
            <li><a href="#music" onClick={handleNavClick}>Music</a></li>
            <li><a href="#services" onClick={handleNavClick}>Services</a></li>
            <li><a href="#contact" onClick={handleNavClick}>Book Us</a></li>
          </ul>
        </nav>
      </header>

      <section id="home" className="hero">
        <div className="hero-content">
          <h1>DJ Lee</h1>
          <div className="subtitle">& Voices of Judah</div>
          <p>Anointed Gospel Music Ministry • Inspiring Hearts Through Powerful Worship</p>
          <div className="location">Gary, Indiana • Est. 2008</div>
          <div className="cta-buttons">
            <a href="#music" className="cta-button" role="button" aria-label="Go to music section">Listen Now</a>
            <a href="#contact" className="cta-button secondary" role="button" aria-label="Go to contact section">Book Event</a>
          </div>
        </div>
      </section>

      <section id="about" className="about">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2>About DJ Lee & Voices of Judah</h2>
              <p>Founded in 2008 in Gary, Indiana, DJ Lee & Voices of Judah began as a high school gospel choir and has grown into a powerful ministry that touches hearts and transforms lives through anointed worship.</p>
              <p>Under the leadership of DJ Lee, our choir has been blessed to minister God's love through song, creating music that uplifts, heals, and draws people closer to the Lord. Our sound is deeply rooted in traditional gospel while embracing contemporary expressions of praise.</p>
              <p>We believe that worship is more than music—it's a lifestyle, a calling, and a ministry that goes beyond the sanctuary walls to impact communities and change lives for the glory of God.</p>
            </div>
            <div className="about-visual">
              <span>Worship<br/>•<br/>Ministry<br/>•<br/>Transformation</span>
            </div>
          </div>
        </div>
      </section>

      <section id="music" className="music">
        <div className="container">
          <h2>Our Musical Journey</h2>
          <p className="subtitle-text">Celebrating God's goodness through powerful gospel music</p>
          <div className="music-grid">
            <div 
              className="music-item"
              onMouseEnter={handleMusicItemHover}
              onMouseLeave={handleMusicItemLeave}
            >
              <div className="music-item-content">
                <h3>"Great & Mighty"</h3>
                <p>Our breakthrough debut single that launched our recording journey and introduced our sound to the gospel music community.</p>
                <div className="year">2013</div>
              </div>
            </div>
            <div 
              className="music-item"
              onMouseEnter={handleMusicItemHover}
              onMouseLeave={handleMusicItemLeave}
            >
              <div className="music-item-content">
                <h3>Live Worship Sessions</h3>
                <p>Dynamic live recordings capturing the authentic energy and anointing of our worship experiences with congregations.</p>
                <div className="year">Ongoing</div>
              </div>
            </div>
            <div 
              className="music-item"
              onMouseEnter={handleMusicItemHover}
              onMouseLeave={handleMusicItemLeave}
            >
              <div className="music-item-content">
                <h3>Community Outreach</h3>
                <p>Musical ministry in schools, community centers, and churches throughout Indiana and beyond, spreading the gospel message.</p>
                <div className="year">Since 2008</div>
              </div>
            </div>
            <div 
              className="music-item"
              onMouseEnter={handleMusicItemHover}
              onMouseLeave={handleMusicItemLeave}
            >
              <div className="music-item-content">
                <h3>Choir Development</h3>
                <p>Training and mentoring the next generation of gospel singers and worship leaders in authentic praise and worship.</p>
                <div className="year">Ongoing</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="services">
        <div className="container">
          <h2>Ministry Services</h2>
          <div className="services-grid">
            <div className="service-card">
              <h3>Worship Leading</h3>
              <p>Anointed worship leading for churches, conferences, and special events. We bring authentic praise that creates an atmosphere for God's presence.</p>
            </div>
            <div className="service-card">
              <h3>Gospel Concerts</h3>
              <p>Dynamic gospel concerts featuring traditional and contemporary worship songs. Perfect for church events, community gatherings, and outreach programs.</p>
            </div>
            <div className="service-card">
              <h3>Choir Training</h3>
              <p>Professional choir direction and training services to help church choirs develop their sound, technique, and ministry effectiveness.</p>
            </div>
            <div className="service-card">
              <h3>Recording Services</h3>
              <p>Professional recording and production services for choirs and solo artists looking to capture their anointed sound and ministry message.</p>
            </div>
            <div className="service-card">
              <h3>Special Events</h3>
              <p>Ministry at weddings, funerals, community celebrations, and special services. Bringing the right atmosphere for every occasion.</p>
            </div>
            <div className="service-card">
              <h3>Youth Ministry</h3>
              <p>Specialized ministry to young people through music, helping them find their voice and calling in worship and praise.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="testimonials">
        <div className="container">
          <h2>What People Are Saying</h2>
          <figure className="testimonial">
            <blockquote>
              <p>"DJ Lee and Voices of Judah brought such a powerful anointing to our church. The congregation was deeply moved and many lives were touched. Their ministry goes beyond just singing—they truly usher people into the presence of God."</p>
            </blockquote>
            <figcaption className="author">— Pastor Williams, New Hope Baptist Church</figcaption>
          </figure>
        </div>
      </section>

      <section id="contact" className="contact">
        <div className="container">
          <h2>Book DJ Lee & Voices of Judah</h2>
          <p className="subtitle-text">Ready to experience anointed worship? Let's minister together at your next event.</p>
          <div className="contact-buttons">
            <a href="mailto:booking@djleevoicesofjudah.com" className="contact-button" aria-label="Send booking email">📧 Email Booking</a>
            <a href="tel:+1234567890" className="contact-button" aria-label="Call for booking">📞 Call Now</a>
            <a href="https://instagram.com/djleevoicesofjudah" className="contact-button" target="_blank" rel="noopener noreferrer" aria-label="Visit Instagram page">📱 Instagram</a>
            <a href="https://soundcloud.com/djleevoicesofjudah" className="contact-button" target="_blank" rel="noopener noreferrer" aria-label="Listen on SoundCloud">🎵 SoundCloud</a>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="footer-content">
            <p>&copy; 2024 DJ Lee & Voices of Judah. All rights reserved.</p>
            <p>Gary, Indiana • Gospel Ministry Since 2008</p>
          </div>
        </div>
      </footer>
      
      <button
        className={`scroll-to-top ${showScrollToTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
        title="Scroll to top"
      >
        ↑
      </button>
    </div>
  );
};

export default LandingPage;