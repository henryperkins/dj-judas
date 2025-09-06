# Ecommerce CSS Style Guide

## Overview

This guide provides a comprehensive CSS implementation for the ecommerce components while maintaining a single CSS file architecture. The styles are organized, maintainable, and optimized for performance, accessibility, and mobile-first design.

## Table of Contents

1. [CSS Organization Structure](#css-organization-structure)
2. [Ecommerce Component Styles](#ecommerce-component-styles)
3. [Implementation Guide](#implementation-guide)
4. [Component Refactoring Examples](#component-refactoring-examples)
5. [Best Practices](#best-practices)
6. [Performance Optimizations](#performance-optimizations)

## CSS Organization Structure

Add these sections to your `index.css` file after section 5 in your current structure:

```css
/* =================================================================
   ECOMMERCE SECTION (Add after section 5 in your current CSS)
   ================================================================= */
```

## Ecommerce Component Styles

### 5.10 Ecommerce Base

```css
/* --- 5.10 Ecommerce Base --- */

/* Product Grid */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 2rem 0;
}

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .product-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

/* Product Card */
.product-card {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.dark .product-card:hover {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
}

.product-card__image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  background: hsl(var(--muted));
}

.product-card__content {
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.product-card__title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: hsl(var(--foreground));
  line-height: 1.3;
}

.product-card__price {
  font-size: 1.25rem;
  font-weight: 700;
  color: hsl(var(--accent));
  margin-bottom: 0.75rem;
}

.product-card__price--old {
  text-decoration: line-through;
  color: hsl(var(--muted-foreground));
  font-size: 1rem;
  font-weight: 400;
  margin-left: 0.5rem;
}

.product-card__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}

@media (max-width: 480px) {
  .product-card__actions {
    flex-direction: column;
  }
  
  .product-card__actions .btn {
    width: 100%;
  }
}
```

### 5.11 Checkout Styles

```css
/* --- 5.11 Checkout Styles --- */

/* Checkout Layout */
.checkout-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem var(--container-padding);
}

.checkout-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 968px) {
  .checkout-grid {
    grid-template-columns: 1fr;
  }
  
  .checkout-summary {
    position: sticky;
    bottom: 0;
    background: hsl(var(--background));
    border-top: 2px solid hsl(var(--border));
    margin: 0 calc(-1 * var(--container-padding));
    padding: 1rem var(--container-padding);
    z-index: 10;
  }
}

/* Checkout Sections */
.checkout-section {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.checkout-section__title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: hsl(var(--foreground));
}
```

### 5.12 Form Styles

```css
/* --- 5.12 Form Styles --- */

/* Form Base */
.form-field {
  margin-bottom: 1.25rem;
}

.form-field:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: hsl(var(--foreground));
}

.form-label--required::after {
  content: " *";
  color: hsl(var(--destructive));
}

/* Input Styles */
.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid hsl(var(--border));
  border-radius: calc(var(--radius) * 0.75);
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  transition: all 0.2s ease;
}

.form-input:hover,
.form-select:hover,
.form-textarea:hover {
  border-color: hsl(var(--muted-foreground));
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: hsl(var(--accent));
  box-shadow: 0 0 0 3px hsl(var(--accent) / 0.1);
}

/* Dark mode form inputs */
.dark .form-input,
.dark .form-select,
.dark .form-textarea {
  background: hsl(var(--card));
  border-color: hsl(var(--border));
}

.dark .form-input:focus,
.dark .form-select:focus,
.dark .form-textarea:focus {
  box-shadow: 0 0 0 3px hsl(var(--accent) / 0.2);
}

/* Input States */
.form-input--error,
.form-select--error,
.form-textarea--error {
  border-color: hsl(var(--destructive));
}

.form-input--error:focus,
.form-select--error:focus,
.form-textarea--error:focus {
  border-color: hsl(var(--destructive));
  box-shadow: 0 0 0 3px hsl(var(--destructive) / 0.1);
}

.form-input:disabled,
.form-select:disabled,
.form-textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: hsl(var(--muted));
}

/* Form Error Message */
.form-error {
  display: block;
  font-size: 0.875rem;
  color: hsl(var(--destructive));
  margin-top: 0.25rem;
}

/* Form Helper Text */
.form-helper {
  display: block;
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  margin-top: 0.25rem;
}

/* Form Grid Responsive */
.form-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 640px) {
  .form-grid-2,
  .form-grid-3 {
    grid-template-columns: 1fr;
  }
}
```

### 5.13 Cart Styles

```css
/* --- 5.13 Cart Styles --- */

.cart-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid hsl(var(--border));
}

.cart-item:last-child {
  border-bottom: none;
}

.cart-item__image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: calc(var(--radius) * 0.5);
  background: hsl(var(--muted));
}

.cart-item__details {
  flex: 1;
}

.cart-item__name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.cart-item__variant {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
}

.cart-item__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Quantity Selector */
.quantity-selector {
  display: flex;
  align-items: center;
  border: 1px solid hsl(var(--border));
  border-radius: calc(var(--radius) * 0.5);
}

.quantity-selector__btn {
  padding: 0.25rem 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: hsl(var(--foreground));
  transition: background 0.2s;
}

.quantity-selector__btn:hover:not(:disabled) {
  background: hsl(var(--muted));
}

.quantity-selector__btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.quantity-selector__value {
  padding: 0.25rem 0.75rem;
  min-width: 3rem;
  text-align: center;
  border-left: 1px solid hsl(var(--border));
  border-right: 1px solid hsl(var(--border));
}

/* Cart Summary */
.cart-summary {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 1.5rem;
}

.cart-summary__row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.cart-summary__row--total {
  border-top: 2px solid hsl(var(--border));
  margin-top: 0.5rem;
  padding-top: 1rem;
  font-size: 1.25rem;
  font-weight: 700;
}
```

### 5.14 Loading States

```css
/* --- 5.14 Loading States --- */

.loading-spinner {
  display: inline-block;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid hsl(var(--muted));
  border-radius: 50%;
  border-top-color: hsl(var(--accent));
  animation: spin 0.8s linear infinite;
}

.loading-spinner--large {
  width: 2.5rem;
  height: 2.5rem;
  border-width: 3px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: hsl(var(--background) / 0.8);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.skeleton {
  background: linear-gradient(
    90deg,
    hsl(var(--muted)) 25%,
    hsl(var(--muted) / 0.5) 50%,
    hsl(var(--muted)) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: calc(var(--radius) * 0.5);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-text {
  height: 1rem;
  margin-bottom: 0.5rem;
}

.skeleton-title {
  height: 1.5rem;
  width: 60%;
  margin-bottom: 1rem;
}
```

### 5.15 Status Messages

```css
/* --- 5.15 Status Messages --- */

.alert {
  padding: 1rem 1.25rem;
  border-radius: var(--radius);
  margin-bottom: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.alert__icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
}

.alert--success {
  background: hsl(var(--success) / 0.1);
  border: 1px solid hsl(var(--success) / 0.3);
  color: hsl(var(--success-700));
}

.alert--error {
  background: hsl(var(--destructive) / 0.1);
  border: 1px solid hsl(var(--destructive) / 0.3);
  color: hsl(var(--destructive));
}

.alert--info {
  background: hsl(var(--accent) / 0.1);
  border: 1px solid hsl(var(--accent) / 0.3);
  color: hsl(var(--accent-700));
}

.alert--warning {
  background: hsl(36 100% 50% / 0.1);
  border: 1px solid hsl(36 100% 50% / 0.3);
  color: hsl(36 100% 35%);
}
```

### 5.16 Utility Classes for Ecommerce

```css
/* --- 5.16 Utility Classes for Ecommerce --- */

/* Spacing Utilities */
.mt-0 { margin-top: 0; }
.mt-1 { margin-top: 0.5rem; }
.mt-2 { margin-top: 1rem; }
.mt-3 { margin-top: 1.5rem; }
.mt-4 { margin-top: 2rem; }

.mb-0 { margin-bottom: 0; }
.mb-1 { margin-bottom: 0.5rem; }
.mb-2 { margin-bottom: 1rem; }
.mb-3 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 2rem; }

.p-0 { padding: 0; }
.p-1 { padding: 0.5rem; }
.p-2 { padding: 1rem; }
.p-3 { padding: 1.5rem; }
.p-4 { padding: 2rem; }

.px-1 { padding-left: 0.5rem; padding-right: 0.5rem; }
.px-2 { padding-left: 1rem; padding-right: 1rem; }
.px-3 { padding-left: 1.5rem; padding-right: 1.5rem; }
.px-4 { padding-left: 2rem; padding-right: 2rem; }

.py-1 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-2 { padding-top: 1rem; padding-bottom: 1rem; }
.py-3 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.py-4 { padding-top: 2rem; padding-bottom: 2rem; }

/* Text Utilities */
.text-sm { font-size: 0.875rem; }
.text-base { font-size: 1rem; }
.text-lg { font-size: 1.125rem; }
.text-xl { font-size: 1.25rem; }
.text-2xl { font-size: 1.5rem; }

.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }

.text-muted { color: hsl(var(--muted-foreground)); }
.text-accent { color: hsl(var(--accent)); }
.text-success { color: hsl(var(--success)); }
.text-error { color: hsl(var(--destructive)); }

/* Display Utilities */
.hidden { display: none; }
.block { display: block; }
.inline-block { display: inline-block; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }

.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.gap-1 { gap: 0.5rem; }
.gap-2 { gap: 1rem; }
.gap-3 { gap: 1.5rem; }

/* Width Utilities */
.w-full { width: 100%; }
.w-auto { width: auto; }

/* Border Utilities */
.rounded { border-radius: var(--radius); }
.rounded-sm { border-radius: calc(var(--radius) * 0.5); }
.rounded-lg { border-radius: calc(var(--radius) * 1.5); }
.rounded-full { border-radius: 9999px; }

/* Shadow Utilities */
.shadow { box-shadow: var(--shadow-1); }
.shadow-lg { box-shadow: var(--shadow-2); }
.shadow-none { box-shadow: none; }
```

### 5.17 Enhanced Button Styles

```css
/* --- 5.17 Enhanced Button Styles --- */

.btn-primary {
  background: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
  border-color: hsl(var(--accent));
}

.btn-primary:hover:not(:disabled) {
  background: hsl(var(--accent-600));
  border-color: hsl(var(--accent-600));
}

.btn-primary:active:not(:disabled) {
  background: hsl(var(--accent-700));
  border-color: hsl(var(--accent-700));
}

.btn-outline {
  background: transparent;
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border));
}

.btn-outline:hover:not(:disabled) {
  background: hsl(var(--muted));
  border-color: hsl(var(--muted-foreground));
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

.btn-icon {
  padding: 0.75rem;
  width: 2.75rem;
  height: 2.75rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.btn-loading {
  position: relative;
  color: transparent;
}

.btn-loading::after {
  content: "";
  position: absolute;
  width: 1rem;
  height: 1rem;
  top: 50%;
  left: 50%;
  margin-left: -0.5rem;
  margin-top: -0.5rem;
  border: 2px solid hsl(var(--accent-foreground));
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 0.6s linear infinite;
}
```

### 5.18 Accessibility Enhancements

```css
/* --- 5.18 Accessibility Enhancements --- */

/* Skip to content */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
  padding: 0.5rem 1rem;
  z-index: 100;
  text-decoration: none;
}

.skip-link:focus {
  top: 0;
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Focus visible enhancement */
:focus-visible {
  outline: 2px solid hsl(var(--accent));
  outline-offset: 2px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .btn,
  .form-input,
  .form-select,
  .form-textarea,
  .card {
    border-width: 2px;
  }
  
  .btn-primary {
    border: 2px solid currentColor;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 5.19 Mobile-First Checkout Improvements

```css
/* --- 5.19 Mobile-First Checkout Improvements --- */

@media (max-width: 768px) {
  /* Mobile checkout optimizations */
  .checkout-container {
    padding: 1rem var(--container-padding);
  }
  
  .checkout-section {
    border-radius: 0;
    margin-left: calc(-1 * var(--container-padding));
    margin-right: calc(-1 * var(--container-padding));
    border-left: none;
    border-right: none;
  }
  
  /* Full-width buttons on mobile */
  .checkout-section .btn {
    width: 100%;
  }
  
  /* Stack payment options */
  .payment-methods {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  /* Sticky checkout footer */
  .checkout-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: hsl(var(--background));
    border-top: 2px solid hsl(var(--accent));
    padding: 1rem var(--container-padding);
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
    z-index: 40;
  }
  
  /* Add padding to account for fixed footer */
  body.has-checkout-footer {
    padding-bottom: 5rem;
  }
  
  /* Larger touch targets */
  .form-input,
  .form-select {
    min-height: 48px;
    font-size: 16px; /* Prevents zoom on iOS */
  }
  
  /* Cart items mobile layout */
  .cart-item {
    position: relative;
    padding-right: 2rem;
  }
  
  .cart-item__remove {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
  }
}
```

### 5.20 Print Styles

```css
/* --- 5.20 Print Styles --- */

@media print {
  .checkout-footer,
  .btn-remove,
  .quantity-selector,
  .alert--info {
    display: none !important;
  }
  
  .checkout-section {
    break-inside: avoid;
  }
  
  .cart-summary {
    border: 2px solid #000;
    padding: 1rem;
  }
}
```

## Component Refactoring Examples

### FeaturedProducts.tsx

Replace inline styles with the new CSS classes:

```tsx
// Before:
<section className="container" style={{ padding: '2rem var(--container-padding)' }}>
  <div className="gallery-grid">
    <div key={p.id} className="card" style={{ padding: '1rem' }}>
      {p.thumbnail && <img src={p.thumbnail} alt={p.title} 
        style={{ width: '100%', borderRadius: 8, aspectRatio: '1 / 1', objectFit: 'cover' }} />}
      <h3 style={{ marginTop: '.75rem' }}>{p.title}</h3>
      <div className="cluster" style={{ marginTop: '.5rem' }}>

// After:
<section className="container py-4">
  <h2 className="section-title">Merch & Music</h2>
  <div className="product-grid">
    {items.map((p) => (
      <div key={p.id} className="product-card">
        {p.thumbnail && (
          <img 
            src={p.thumbnail} 
            alt={p.title} 
            className="product-card__image"
          />
        )}
        <div className="product-card__content">
          <h3 className="product-card__title">{p.title}</h3>
          <div className="product-card__price">$19.99</div>
          <div className="product-card__actions">
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/checkout')}>
              Details
            </button>
            <button className="btn btn-primary btn-sm" onClick={async () => {
              const v = p.variants?.[0]?.id
              if (v) {
                const ok = await addLineItem(v, 1)
                if (ok) navigate('/checkout')
              }
            }}>
              Add to cart
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
</section>
```

### CheckoutPage.tsx

Implement proper form styling and validation:

```tsx
// After refactoring:
<div className="checkout-container">
  <button className="btn btn-ghost mb-3" onClick={() => navigate('/')}>
    ← Back
  </button>
  <h1 className="section-title">Checkout</h1>
  
  <div className="checkout-grid">
    <div>
      <section className="checkout-section">
        <h2 className="checkout-section__title">Shipping Address</h2>
        <div className="form-grid-2">
          <div className="form-field">
            <label className="form-label form-label--required" htmlFor="email">
              Email
            </label>
            <input 
              id="email"
              className={`form-input ${errors.email ? 'form-input--error' : ''}`}
              type="email"
              value={addr.email} 
              onChange={e => setAddr({ ...addr, email: e.target.value })}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <span id="email-error" className="form-error">
                {errors.email}
              </span>
            )}
          </div>
          
          <div className="form-field">
            <label className="form-label form-label--required" htmlFor="first_name">
              First Name
            </label>
            <input 
              id="first_name"
              className="form-input"
              type="text"
              value={addr.first_name} 
              onChange={e => setAddr({ ...addr, first_name: e.target.value })}
            />
          </div>
          
          {/* More fields... */}
        </div>
        
        <button 
          className={`btn btn-primary w-full mt-3 ${busy ? 'btn-loading' : ''}`}
          onClick={saveAddress}
          disabled={busy || !cartId}
        >
          {!busy && 'Save Address'}
        </button>
      </section>
      
      <section className="checkout-section">
        <h2 className="checkout-section__title">Shipping Options</h2>
        <div className="stack">
          <button 
            className="btn btn-outline" 
            onClick={loadOptions} 
            disabled={!cartId}
          >
            Load Shipping Options
          </button>
          {options?.map((o: ShippingOption) => (
            <button 
              className="btn btn-outline" 
              key={o.id} 
              onClick={() => addShippingMethod(o.id)}
            >
              {o.name}
              {o.amount && <span className="text-muted ml-2">
                ${(o.amount / 100).toFixed(2)}
              </span>}
            </button>
          ))}
        </div>
      </section>
    </div>
    
    <aside className="checkout-summary">
      <h2 className="checkout-section__title">Order Summary</h2>
      {/* Cart items would go here */}
      <div className="cart-summary__row">
        <span>Subtotal</span>
        <span>$0.00</span>
      </div>
      <div className="cart-summary__row">
        <span>Shipping</span>
        <span>$0.00</span>
      </div>
      <div className="cart-summary__row cart-summary__row--total">
        <span>Total</span>
        <span>$0.00</span>
      </div>
    </aside>
  </div>
</div>
```

### SuccessPage.tsx

Implement better success messaging:

```tsx
// After refactoring:
<div className="container py-4">
  <div className="alert alert--success">
    <svg className="alert__icon" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
    <div>
      <h1 className="text-2xl font-bold mb-1">Thank you for your order!</h1>
      <p className="text-muted">Your order was received and is being processed.</p>
    </div>
  </div>
  
  {error && (
    <div className="alert alert--error mt-3">
      <p>{error}</p>
    </div>
  )}
  
  {info && (
    <div className="cart-summary mt-3">
      <div className="cart-summary__row">
        <span>Order ID:</span>
        <span className="font-mono text-sm">{info.id}</span>
      </div>
      <div className="cart-summary__row">
        <span>Status:</span>
        <span className="font-semibold text-success">
          {info.payment_status || 'Paid'}
        </span>
      </div>
      {info.client_reference_id && (
        <div className="cart-summary__row">
          <span>Reference:</span>
          <span className="font-mono text-sm">{info.client_reference_id}</span>
        </div>
      )}
      <div className="cart-summary__row cart-summary__row--total">
        <span>Total:</span>
        <span>{formatAmount(info.amount_total, info.currency)}</span>
      </div>
    </div>
  )}
  
  <div className="flex gap-2 mt-4">
    <button className="btn btn-outline" onClick={() => navigate('/')}>
      Back to Home
    </button>
    <button className="btn btn-primary" onClick={() => navigate('/checkout')}>
      Continue Shopping
    </button>
  </div>
</div>
```

## Best Practices

### 1. CSS Variable Usage

Define component-specific variables for easy customization:

```css
:root {
  /* Product Card */
  --product-card-min-width: 280px;
  --product-card-gap: 1.5rem;
  --product-card-image-ratio: 1;
  
  /* Checkout */
  --checkout-max-width: 1200px;
  --checkout-sidebar-width: 400px;
  --checkout-section-padding: 1.5rem;
  
  /* Forms */
  --form-input-height: 48px;
  --form-label-margin: 0.5rem;
  --form-error-color: hsl(var(--destructive));
}
```

### 2. Naming Conventions

Use BEM-like naming for component classes:
- Block: `.product-card`
- Element: `.product-card__title`
- Modifier: `.product-card--featured`

### 3. Mobile-First Development

Always start with mobile styles and enhance for larger screens:

```css
/* Mobile first */
.product-grid {
  grid-template-columns: 1fr;
}

/* Tablet and up */
@media (min-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}
```

### 4. Accessibility Guidelines

Always include:
- Focus visible states for all interactive elements
- ARIA labels and descriptions where needed
- Proper color contrast (WCAG AA minimum)
- Touch targets of at least 44x44px
- Screen reader only text for important context

### 5. Performance Considerations

- Use CSS transforms for animations (GPU accelerated)
- Minimize reflows by batching DOM changes
- Use `will-change` sparingly for animations
- Lazy load non-critical CSS if possible
- Minimize selector specificity

## Performance Optimizations

### Critical CSS Extraction

Even with a single file, mark critical styles for inline loading:

```css
/* @critical-start */
/* Essential above-the-fold styles */
.container { /* ... */ }
.btn { /* ... */ }
.product-grid { /* ... */ }
/* @critical-end */

/* @non-critical-start */
/* Below-the-fold and interaction styles */
@keyframes shimmer { /* ... */ }
.loading-overlay { /* ... */ }
/* @non-critical-end */
```

### CSS Optimization Tools

1. **PostCSS** - For autoprefixing and optimization
2. **PurgeCSS** - Remove unused styles
3. **CSSnano** - Minification and optimization
4. **StyleLint** - Enforce consistent CSS

### Bundle Size Reduction

- Remove unused utility classes
- Combine similar media queries
- Use CSS custom properties to reduce repetition
- Minify in production

## Implementation Checklist

- [ ] Add CSS sections to `index.css`
- [ ] Update `FeaturedProducts.tsx` to use new classes
- [ ] Update `CheckoutPage.tsx` with proper form styling
- [ ] Update `SuccessPage.tsx` with alert styles
- [ ] Remove all inline styles from components
- [ ] Test on mobile devices (iOS and Android)
- [ ] Validate accessibility with axe-core
- [ ] Test dark mode thoroughly
- [ ] Verify all interactive states (hover, focus, active)
- [ ] Test with keyboard navigation
- [ ] Validate forms with screen readers
- [ ] Performance audit with Lighthouse

## Summary

This single-file CSS approach provides:

1. **Organization** - Clear sections with numbered hierarchy
2. **Maintainability** - BEM naming, utility classes, CSS variables
3. **Performance** - Optimized selectors, mobile-first, critical CSS markers
4. **Accessibility** - Proper focus states, ARIA support, contrast ratios
5. **Responsiveness** - Mobile-first with proper breakpoints
6. **Dark Mode** - Complete theme support
7. **Reusability** - Utility classes reduce code duplication

The implementation maintains simplicity while providing professional-grade styling for your ecommerce components. The organized structure makes it easy to find and modify styles, while the utility classes and CSS variables ensure consistency across the application.