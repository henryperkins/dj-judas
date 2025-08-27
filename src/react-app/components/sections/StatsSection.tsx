import React from 'react';
import { motion } from 'framer-motion';
import './StatsSection.css';
import { useInView } from 'react-intersection-observer';
import { Calendar, Music, Users, Award } from 'lucide-react';

interface StatItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: string;
  label: string;
}

const StatsSection: React.FC = () => {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });
  
  const stats: StatItem[] = [
    { icon: Calendar, value: '16+', label: 'Years of Ministry' },
    { icon: Music, value: '4+', label: 'Released Singles' },
    { icon: Users, value: '1.6K+', label: 'Facebook Followers' },
    { icon: Award, value: '2020-2022', label: 'Latest Releases' }
  ];

  return (
    <section className="stats-section" ref={ref}>
      <div className="container">
        <div className="stats-grid">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                className="stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Icon size={32} className="stat-icon" />
                <h3 className="stat-value">{stat.value}</h3>
                <p className="stat-label">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
