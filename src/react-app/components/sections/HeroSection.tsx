import React from 'react';
import { motion, MotionValue } from 'framer-motion';

import { LuChevronDown } from 'react-icons/lu';
import { navigate } from '../../utils/nav';
import pattern1 from '../../assets/images/pattern1.jpeg';
import logoImage from '../../assets/images/logo.jpeg';

interface HeroSectionProps {
  scrollY?: MotionValue<number>;
  className?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ className = '' }) => {
  return (
    <motion.section
      id="home"
      className={`hero-section ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="hero-background with-pattern" style={{ backgroundImage: `url(${pattern1})` }}>
        <div className="hero-overlay"></div>
      </div>
      <div className="hero-content">
        <motion.img
          src={logoImage}
          alt="DJ Lee & Voices of Judah"
          style={{ maxWidth: '250px', marginBottom: '1.5rem', display: 'block', margin: '0 auto 1.5rem' }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.8 }}
        />
        <motion.h1
          className="hero-title"
          initial={{ y: 30 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          DJ Lee & Voices of Judah
        </motion.h1>
        <motion.p
          className="hero-subtitle"
          initial={{ y: 30 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          High-energy gospel DJ and vocal ensemble for weddings, reunions, and ministry events.
        </motion.p>
        <motion.div
          className="hero-cta"
          initial={{ y: 30 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <button className="btn btn-primary" onClick={() => navigate('/book')}>Book Us</button>
          <a href="#media" className="btn btn-secondary">Listen</a>
        </motion.div>
      </div>
      <motion.div
        className="scroll-indicator"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <LuChevronDown size={32} />
      </motion.div>
    </motion.section>
  );
};

export default HeroSection;
