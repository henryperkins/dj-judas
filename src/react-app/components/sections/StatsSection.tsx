import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { useInView } from 'react-intersection-observer';
import { LuCalendar, LuMusic, LuUsers, LuAward } from 'react-icons/lu';

interface StatItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: string;
  label: string;
}

const StatsSection: React.FC = () => {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  const stats: StatItem[] = [
    { icon: LuCalendar, value: '16+', label: 'Years of Ministry' },
    { icon: LuMusic, value: '4+', label: 'Released Singles' },
    { icon: LuUsers, value: '1.6K+', label: 'Facebook Followers' },
    { icon: LuAward, value: '2020-2022', label: 'Latest Releases' }
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
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card>
                  <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
                    <Icon className="stat-icon" />
                    <div className="text-3xl font-bold text-foreground leading-none">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
