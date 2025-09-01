import React from 'react';
import { motion } from 'framer-motion';
import './HeroSection.css';
import { ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  scrollY?: any;
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
      <div className="hero-background">
        <div className="hero-overlay"></div>
      </div>
      <div className="hero-content">
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
          Spreading the Gospel Through Music Since 2008 • Gary, Indiana
        </motion.p>
        <motion.div 
          className="hero-cta"
          initial={{ y: 30 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <a href="#music" className="btn btn-primary">Listen Now</a>
          <a href="#booking" className="btn btn-secondary">Book Us</a>
        </motion.div>
      </div>
      <motion.div 
        className="scroll-indicator"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <ChevronDown size={32} />
      </motion.div>
    </motion.section>
  );
};

export default HeroSection;
