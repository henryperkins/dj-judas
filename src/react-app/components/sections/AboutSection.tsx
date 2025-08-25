import React from 'react';
import { motion } from 'framer-motion';
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
                DJ Lee & The Voices of Judah is a gospel music ministry dedicated to spreading 
                the word of God through powerful, uplifting music. With over 16 years of ministry, 
                we have touched countless lives through our performances and recordings.
              </p>
              <p>
                Our mission is to inspire, encourage, and bring hope through gospel music that 
                speaks to the heart and soul. From traditional hymns to contemporary gospel, 
                we deliver a worship experience that brings people closer to God.
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