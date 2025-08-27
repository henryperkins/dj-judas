import React from 'react';
import { motion } from 'framer-motion';
import './ServicesSection.css';
import { useInView } from 'react-intersection-observer';
import { Church, Mic, Music2, Heart } from 'lucide-react';

interface Service {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
}

const ServicesSection: React.FC = () => {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  const services: Service[] = [
    {
      icon: Church,
      title: 'Church Services',
      description: 'Bringing powerful worship to your congregation'
    },
    {
      icon: Mic,
      title: 'Concerts & Events',
      description: 'Professional gospel performances for any occasion'
    },
    {
      icon: Music2,
      title: 'Recording & Production',
      description: 'Studio-quality gospel music production'
    },
    {
      icon: Heart,
      title: 'Special Occasions',
      description: 'Weddings, anniversaries, and celebrations'
    }
  ];

  return (
    <section id="services" className="services-section" ref={ref}>
      <div className="container">
        <motion.h2 
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          Our Services
        </motion.h2>
        <div className="services-grid">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.title}
                className="service-card"
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Icon size={48} className="service-icon" />
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
