import React, { useEffect, useState } from 'react';
import { motion, MotionValue, useReducedMotion } from 'framer-motion';

import { LuChevronDown } from 'react-icons/lu';
import { navigate } from '../../utils/nav';
import pattern1 from '../../assets/images/pattern1.jpeg';
import logoImage from '../../assets/images/logo.jpeg';

interface HeroSectionProps {
  scrollY?: MotionValue<number>;
  className?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ className = '' }) => {
  // Skip animations on initial page load to optimize LCP
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const shouldReduceMotion = useReducedMotion();
  const allowMotion = !isInitialLoad && !shouldReduceMotion;

  useEffect(() => {
    // After initial render, enable animations for subsequent navigations
    const timer = setTimeout(() => setIsInitialLoad(false), 100);
    return () => clearTimeout(timer);
  }, []);

  // Skip animations on first load to prevent LCP re-measurement
  const sectionVariants = !allowMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0 }, animate: { opacity: 1 } };

  const imageVariants = !allowMotion
    ? { initial: { scale: 1, opacity: 1 }, animate: { scale: 1, opacity: 1 } }
    : { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 } };

  const textVariants = !allowMotion
    ? { initial: { y: 0 }, animate: { y: 0 } }
    : { initial: { y: 30 }, animate: { y: 0 } };

  return (
    <motion.section
      className={`hero-section ${className}`}
      initial={sectionVariants.initial}
      animate={sectionVariants.animate}
      transition={{ duration: allowMotion ? 0.8 : 0 }}
    >
      <div className="hero-background with-pattern" style={{ backgroundImage: `url(${pattern1})` }}>
        <div className="hero-overlay"></div>
      </div>
      <div className="hero-content">
        <motion.div
          className="hero-logo-frame"
          initial={imageVariants.initial}
          animate={imageVariants.animate}
          transition={{ delay: allowMotion ? 0.1 : 0, duration: allowMotion ? 0.8 : 0 }}
        >
          <img
            src={logoImage}
            alt="DJ Lee & Voices of Judah"
            className="hero-logo"
            fetchPriority="high"
          />
        </motion.div>
        <motion.h1
          id="hero-heading"
          className="hero-title"
          initial={textVariants.initial}
          animate={textVariants.animate}
          transition={{ delay: allowMotion ? 0.2 : 0, duration: allowMotion ? 0.8 : 0 }}
        >
          DJ Lee & Voices of Judah
        </motion.h1>
        <motion.p
          className="hero-subtitle"
          initial={textVariants.initial}
          animate={textVariants.animate}
          transition={{ delay: allowMotion ? 0.4 : 0, duration: allowMotion ? 0.8 : 0 }}
        >
          High-energy gospel DJ and vocal ensemble for weddings, reunions, and ministry events.
        </motion.p>
        <motion.div
          className="hero-cta"
          initial={textVariants.initial}
          animate={textVariants.animate}
          transition={{ delay: allowMotion ? 0.6 : 0, duration: allowMotion ? 0.8 : 0 }}
        >
          <button className="btn btn-primary" onClick={() => navigate('/book')}>Book Us</button>
          <a href="#media" className="btn btn-secondary">Listen</a>
        </motion.div>
      </div>
      <motion.div
        className="scroll-indicator"
        animate={shouldReduceMotion ? { y: 0 } : { y: [0, 10, 0] }}
        transition={shouldReduceMotion ? { duration: 0 } : { repeat: Infinity, duration: 2 }}
      >
        <LuChevronDown size={32} />
      </motion.div>
    </motion.section>
  );
};

export default HeroSection;
