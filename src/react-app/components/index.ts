// Main component export
export { default as EnhancedLandingPage } from './EnhancedLandingPageV2';

// Mobile components
export { default as PlatformLauncher } from './PlatformLauncher';
export { default as MobileBottomNav } from './MobileBottomNav';

// Section components
export { default as HeroSection } from './sections/HeroSection';
export { default as StatsSection } from './sections/StatsSection';
export { default as AboutSection } from './sections/AboutSection';
export { default as ServicesSection } from './sections/ServicesSection';

// Core components still needed
export { SpotifyEmbed, AppleMusicEmbed } from './social';
export { default as PhotoGallery } from './PhotoGallery';
export { default as BookingForm } from './BookingForm';


// Utilities
export * from '../utils/platformDetection';
export * from './social/utils/metaSdk';
export * from './social/utils/socialMetrics';
