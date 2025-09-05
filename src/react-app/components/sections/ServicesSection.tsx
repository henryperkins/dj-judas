import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LuChurch, LuMic, LuMusic2, LuHeart } from 'react-icons/lu';

interface Service {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
}

const ServicesSection: React.FC = () => {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  const services: Service[] = [
    {
      icon: LuChurch,
      title: 'Church Services',
      description: 'Anointed worship ministry for Sunday services, revivals, and special church events throughout Northwest Indiana'
    },
    {
      icon: LuMic,
      title: 'Gospel Concerts & Festivals',
      description: 'Dynamic performances for gospel concerts, community festivals, and Christian conferences'
    },
    {
      icon: LuMusic2,
      title: 'Youth Choir Training',
      description: 'Mentoring and developing young voices in gospel music through workshops and masterclasses'
    },
    {
      icon: LuHeart,
      title: 'Special Occasions',
      description: 'Ministry through music for weddings, funerals, anniversaries, and milestone celebrations'
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
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Card>
                  <CardHeader className="items-center text-center">
                    <Icon className="service-icon" />
                    <CardTitle className="mt-2">{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent />
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
