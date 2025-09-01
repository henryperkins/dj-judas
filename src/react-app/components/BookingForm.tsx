import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, Mail, Phone, MessageSquare, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FormData {
  name: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  location: string;
  message: string;
}

const BookingForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    eventType: 'worship',
    eventDate: '',
    eventTime: '',
    location: '',
    message: ''
  });
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const eventTypes = [
    { value: 'worship', label: 'Worship Service' },
    { value: 'concert', label: 'Gospel Concert' },
    { value: 'wedding', label: 'Wedding Ceremony' },
    { value: 'funeral', label: 'Funeral Service' },
    { value: 'conference', label: 'Conference/Revival' },
    { value: 'community', label: 'Community Event' },
    { value: 'other', label: 'Other' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.eventDate) newErrors.eventDate = 'Event date is required';
    if (!formData.eventTime) newErrors.eventTime = 'Event time is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    let sent = false;
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        sent = true;
      }
    } catch {}

    // Fallback: prefilled email if API unavailable
    if (!sent) {
      try {
        const subject = encodeURIComponent(`Booking Request: ${formData.eventType} on ${formData.eventDate}`);
        const body = encodeURIComponent([
          `Name: ${formData.name}`,
          `Email: ${formData.email}`,
          `Phone: ${formData.phone}`,
          `Event Type: ${formData.eventType}`,
          `Date: ${formData.eventDate} ${formData.eventTime}`,
          `Location: ${formData.location}`,
          '',
          'Message:',
          formData.message
        ].join('\n'));
        window.location.href = `mailto:V.O.J@icloud.com?subject=${subject}&body=${body}`;
      } catch {}
    }
    
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        eventType: 'worship',
        eventDate: '',
        eventTime: '',
        location: '',
        message: ''
      });
    }, 3000);
  };

  return (
    <div className="booking-form-container">
      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.form
            key="form"
            className="booking-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h3>Book DJ Lee & Voices of Judah</h3>
            <p className="form-subtitle">Fill out the form below and we'll get back to you within 24 hours</p>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">
                  <User size={16} /> Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  placeholder="John Doe"
                />
                {errors.name && <span id="name-error" className="error-message" role="alert">{errors.name}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="email">
                  <Mail size={16} /> Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  placeholder="john@example.com"
                />
                {errors.email && <span id="email-error" className="error-message" role="alert">{errors.email}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">
                  <Phone size={16} /> Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={errors.phone ? 'error' : ''}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                  placeholder="(555) 123-4567"
                />
                {errors.phone && <span id="phone-error" className="error-message" role="alert">{errors.phone}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="eventType">Event Type</label>
                <select
                  id="eventType"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                >
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="eventDate">
                  <Calendar size={16} /> Event Date
                </label>
                <input
                  type="date"
                  id="eventDate"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                  className={errors.eventDate ? 'error' : ''}
                  aria-invalid={!!errors.eventDate}
                  aria-describedby={errors.eventDate ? 'eventDate-error' : undefined}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.eventDate && <span id="eventDate-error" className="error-message" role="alert">{errors.eventDate}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="eventTime">
                  <Clock size={16} /> Event Time
                </label>
                <input
                  type="time"
                  id="eventTime"
                  name="eventTime"
                  value={formData.eventTime}
                  onChange={handleChange}
                  className={errors.eventTime ? 'error' : ''}
                  aria-invalid={!!errors.eventTime}
                  aria-describedby={errors.eventTime ? 'eventTime-error' : undefined}
                />
                {errors.eventTime && <span id="eventTime-error" className="error-message" role="alert">{errors.eventTime}</span>}
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="location">
                  <MapPin size={16} /> Event Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={errors.location ? 'error' : ''}
                  aria-invalid={!!errors.location}
                  aria-describedby={errors.location ? 'location-error' : undefined}
                  placeholder="Church name and address"
                />
                {errors.location && <span id="location-error" className="error-message" role="alert">{errors.location}</span>}
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="message">
                  <MessageSquare size={16} /> Additional Details (Optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Tell us more about your event..."
                />
              </div>
            </div>
            
            <button type="submit" className="submit-button">
              Send Booking Request
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="success"
            className="success-message"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className="success-icon">
              <Check size={48} />
            </div>
            <h3>Booking Request Sent!</h3>
            <p>Thank you for your interest in booking DJ Lee & Voices of Judah.</p>
            <p>We'll review your request and get back to you within 24 hours.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingForm;
