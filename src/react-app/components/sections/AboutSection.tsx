import React from 'react';
import { motion } from 'framer-motion';
import './AboutSection.css';
import { useInView } from 'react-intersection-observer';

const AboutSection: React.FC = () => {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <section id="about" className="about-section" ref={ref}>
      <div className="container">
        <motion.div
          className="about-content"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="section-title">About Us</h2>
          <div className="about-grid">
            <div className="about-text">
              <p>
                DJ Lee & The Voices of Judah was established in 2008 in Gary, Indiana, when 
                D.J. Lee was given the opportunity to form a gospel choir within his high school. 
                What started as a school choir has grown into a powerful gospel music ministry 
                that has been touching lives for over 16 years.
              </p>
              <p>
                Based in Gary, Indiana, our mission is to inspire, encourage, and bring hope 
                through gospel music that speaks to the heart and soul. From traditional hymns 
                to contemporary gospel, we deliver a worship experience that brings people closer 
                to God. Our music, including hits like "I Love to Praise Him" and "King's Motorcade," 
                continues to reach audiences across the nation.
              </p>
            </div>
            <div className="about-image">
              <img 
                src="/images/group-photo.jpg" 
                alt="DJ Lee & Voices of Judah" 
                loading="lazy"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
