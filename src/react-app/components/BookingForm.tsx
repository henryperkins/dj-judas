import React, { useState } from 'react';
import { LuCalendar, LuClock, LuMapPin, LuUser, LuMail, LuPhone, LuMessageSquare, LuCheck } from 'react-icons/lu';
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

type FormErrors = Partial<Record<keyof FormData, string>>;

const getTodayLocal = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

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

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const eventTypes = [
    { value: 'worship', label: 'Worship Service' },
    { value: 'concert', label: 'Gospel Concert' },
    { value: 'wedding', label: 'Wedding Ceremony' },
    { value: 'funeral', label: 'Funeral Service' },
    { value: 'conference', label: 'Conference/Revival' },
    { value: 'community', label: 'Community Event' },
    { value: 'other', label: 'Other' }
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field and any submit error
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (submitError) setSubmitError(null);
  };

  const focusFirstError = (errs: FormErrors) => {
    const order: (keyof FormData)[] = [
      'name',
      'email',
      'phone',
      'eventType',
      'eventDate',
      'eventTime',
      'location',
      'message'
    ];
    const first = order.find(k => errs[k]);
    if (first) {
      const el = document.getElementById(first);
      if (el) el.focus();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const trim = (s: string) => s.trim();

    if (!trim(formData.name)) newErrors.name = 'Name is required';
    if (!trim(formData.email)) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Invalid email address';
    if (!trim(formData.phone)) newErrors.phone = 'Phone number is required';
    if (!formData.eventDate) newErrors.eventDate = 'Event date is required';
    if (!formData.eventTime) newErrors.eventTime = 'Event time is required';
    if (!trim(formData.location)) newErrors.location = 'Location is required';

    // Ensure selected date+time is in the future
    if (formData.eventDate && formData.eventTime) {
      const selected = new Date(`${formData.eventDate}T${formData.eventTime}`);
      if (selected.getTime() < Date.now()) {
        newErrors.eventTime = 'Please choose a future time';
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    if (!isValid) focusFirstError(newErrors);
    return isValid;
  };

  const resetForm = () => {
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
    setErrors({});
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    let sent = false;
    let networkError = false;

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        sent = true;
      } else {
        // Try to extract a meaningful error from the server
        try {
          const data = await res.json();
          setSubmitError(
            typeof data?.message === 'string'
              ? data.message
              : 'We could not submit your request. Please try again.'
          );
        } catch {
          const text = await res.text().catch(() => '');
          setSubmitError(
            text?.trim()
              ? text
              : 'We could not submit your request. Please try again.'
          );
        }
      }
    } catch {
      networkError = true;
    }

    // Fallback: prefilled email if true network failure
    if (!sent && networkError) {
      try {
        const subject = encodeURIComponent(
          `Booking Request: ${formData.eventType} on ${formData.eventDate}`
        );
        const body = encodeURIComponent(
          [
            `Name: ${formData.name}`,
            `Email: ${formData.email}`,
            `Phone: ${formData.phone}`,
            `Event Type: ${formData.eventType}`,
            `Date: ${formData.eventDate} ${formData.eventTime}`,
            `Location: ${formData.location}`,
            '',
            'Message:',
            formData.message
          ].join('\n')
        );
        window.location.href = `mailto:V.O.J@icloud.com?subject=${subject}&body=${body}`;
        setSubmitError(
          'We could not reach the server. We opened your email client with a prefilled message as a fallback.'
        );
      } catch {
        setSubmitError(
          'We could not reach the server. Please email V.O.J@icloud.com with your booking details.'
        );
      }
    }

    if (sent) {
      setIsSubmitted(true);
      // Prepare a fresh form for the next request
      resetForm();
    }

    setIsSubmitting(false);
  };

  const handleNewRequest = () => {
    setIsSubmitted(false);
    resetForm();
  };

  return (
    <div className="booking-form-container">
      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.form
            key="form"
            className="booking-form"
            onSubmit={handleSubmit}
            noValidate
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            aria-busy={isSubmitting}
          >
            <h3>Book DJ Lee &amp; Voices of Judah</h3>
            <p className="form-subtitle">
              Fill out the form below and we'll get back to you within 24 hours
            </p>

            {submitError && (
              <div className="form-error" role="alert" aria-live="assertive">
                {submitError}
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">
                  <LuUser size={16} /> Full Name
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
                  autoComplete="name"
                />
                {errors.name && (
                  <span id="name-error" className="error-message" role="alert">
                    {errors.name}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  <LuMail size={16} /> Email Address
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
                  autoComplete="email"
                />
                {errors.email && (
                  <span id="email-error" className="error-message" role="alert">
                    {errors.email}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  <LuPhone size={16} /> Phone Number
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
                  autoComplete="tel"
                  inputMode="tel"
                  pattern="^[0-9+() \-]{7,}$"
                  title="Enter a valid phone number"
                />
                {errors.phone && (
                  <span id="phone-error" className="error-message" role="alert">
                    {errors.phone}
                  </span>
                )}
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
                  <LuCalendar size={16} /> Event Date
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
                  min={getTodayLocal()}
                  autoComplete="off"
                />
                {errors.eventDate && (
                  <span id="eventDate-error" className="error-message" role="alert">
                    {errors.eventDate}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="eventTime">
                  <LuClock size={16} /> Event Time
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
                  autoComplete="off"
                />
                {errors.eventTime && (
                  <span id="eventTime-error" className="error-message" role="alert">
                    {errors.eventTime}
                  </span>
                )}
              </div>

              <div className="form-group full-width">
                <label htmlFor="location">
                  <LuMapPin size={16} /> Event Location
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
                  autoComplete="street-address"
                />
                {errors.location && (
                  <span id="location-error" className="error-message" role="alert">
                    {errors.location}
                  </span>
                )}
              </div>

              <div className="form-group full-width">
                <label htmlFor="message">
                  <LuMessageSquare size={16} /> Additional Details (Optional)
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

            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
              aria-disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending…' : 'Send Booking Request'}
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
              <LuCheck size={48} />
            </div>
            <h3>Booking Request Sent!</h3>
            <p>Thank you for your interest in booking DJ Lee &amp; Voices of Judah.</p>
            <p>We'll review your request and get back to you within 24 hours.</p>
            <button className="submit-button" onClick={handleNewRequest}>
              New Booking Request
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingForm;
