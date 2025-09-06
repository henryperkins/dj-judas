import React from 'react';
import { motion } from 'framer-motion';
import { navigate } from '../utils/nav';
import BookingForm from '../components/BookingForm';

const BookingPage: React.FC = () => {
  return (
    <div className="booking-page">
      <header className="page-header container" style={{ padding: '1rem var(--container-padding)' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/')}>← Back</button>
      </header>
      <main className="container" style={{ paddingBottom: '3rem' }}>
        <motion.h1
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Book Us
        </motion.h1>
        <p className="section-subtitle" style={{ marginBottom: '1rem', opacity: 0.9 }}>
          Share a few details and we’ll get back within a day.
        </p>
        <BookingForm tone="casual" />
      </main>
    </div>
  );
};

export default BookingPage;

