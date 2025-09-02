import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import './index.css';

interface Photo {
  id: number;
  src: string;
  alt: string;
  caption: string;
  category: string;
}

const photos: Photo[] = [
  { id: 1, src: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', alt: 'Live Performance at Gary Gospel Fest', caption: 'Gary Gospel Fest 2024 - Main Stage Performance', category: 'worship' },
  { id: 2, src: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400', alt: 'Voices of Judah Choir Practice', caption: 'Thursday Night Rehearsal at Greater Faith Community', category: 'worship' },
  { id: 3, src: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=400', alt: 'Community Outreach in Gary', caption: 'Gary Community Outreach - Feeding the Homeless', category: 'community' },
  { id: 4, src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', alt: 'Studio Recording Session', caption: 'Recording "I Love to Praise Him" at Chicago Studios', category: 'recording' },
  { id: 5, src: 'https://images.unsplash.com/photo-1529636644619-cf0d5a34e679?w=400', alt: 'Sunday Morning Worship', caption: 'Sunday Worship Service - Victory Temple Church', category: 'worship' },
  { id: 6, src: 'https://images.unsplash.com/photo-1477281765962-ef34e8bb0967?w=400', alt: 'Youth Choir Training', caption: 'Northwest Indiana Youth Choir Workshop 2024', category: 'youth choir' },
];

const categories = ['all', 'worship', 'youth choir', 'community', 'recording'];

const PhotoGallery: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);

  const filteredPhotos = selectedCategory === 'all' 
    ? photos 
    : photos.filter(photo => photo.category === selectedCategory);

  const openLightbox = (photo: Photo) => {
    setSelectedPhoto(photo);
    setCurrentIndex(filteredPhotos.findIndex(p => p.id === photo.id));
  };

  const nextPhoto = () => {
    const newIndex = (currentIndex + 1) % filteredPhotos.length;
    setCurrentIndex(newIndex);
    setSelectedPhoto(filteredPhotos[newIndex]);
  };

  const prevPhoto = () => {
    const newIndex = (currentIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
    setCurrentIndex(newIndex);
    setSelectedPhoto(filteredPhotos[newIndex]);
  };

  // Handle swipe gestures for mobile
  const handleDragEnd = (_event: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold) {
      prevPhoto();
    } else if (info.offset.x < -threshold) {
      nextPhoto();
    }
  };

  // Touch events for better mobile support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextPhoto();
    }
    if (isRightSwipe) {
      prevPhoto();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'Escape') setSelectedPhoto(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, currentIndex]);

  const buildSrcSet = (url: string) => {
    try {
      const u = new URL(url);
      const w = u.searchParams.get('w');
      const baseW = w ? parseInt(w, 10) : 400;
      const w1 = baseW;
      const w2 = Math.min(baseW * 2, 1600);
      u.searchParams.set('w', String(w1));
      const src1 = u.toString();
      u.searchParams.set('w', String(w2));
      const src2 = u.toString();
      return `${src1} ${w1}w, ${src2} ${w2}w`;
    } catch {
      return `${url} 400w`;
    }
  };

  return (
    <div className="photo-gallery">
      <div className="gallery-header">
        <h2>Gallery</h2>
        <p>Capturing moments of worship, ministry, and community impact</p>
      </div>

      <div className="category-filters">
        {categories.map(category => (
          <button
            key={category}
            className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      <motion.div className="gallery-grid" layout>
        <AnimatePresence>
          {filteredPhotos.map((photo) => (
            <motion.div
              key={photo.id}
              className="gallery-item"
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              onClick={() => openLightbox(photo)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={photo.src}
                srcSet={buildSrcSet(photo.src)}
                sizes="(min-width: 768px) 300px, 50vw"
                width={400}
                height={300}
                alt={photo.alt}
                loading="lazy"
                decoding="async"
              />
              <div className="photo-overlay">
                <p>{photo.caption}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <Dialog.Root open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="lightbox-overlay" />
          <Dialog.Content className="lightbox-content">
            <Dialog.Close className="lightbox-close">
              <X size={24} />
            </Dialog.Close>
            
            {selectedPhoto && (
              <motion.div
                ref={lightboxRef}
                className="lightbox-image-container"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ x, opacity, touchAction: 'pan-y' }}
                animate={{ x: 0 }}
              >
                <button 
                  className="lightbox-nav lightbox-prev" 
                  onClick={prevPhoto}
                  aria-label="Previous photo"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  <ChevronLeft size={32} />
                </button>
                
                <img
                  src={selectedPhoto.src}
                  srcSet={buildSrcSet(selectedPhoto.src)}
                  sizes="90vw"
                  width={800}
                  height={600}
                  alt={selectedPhoto.alt}
                  loading="lazy"
                  decoding="async"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                />
                
                <button 
                  className="lightbox-nav lightbox-next" 
                  onClick={nextPhoto}
                  aria-label="Next photo"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  <ChevronRight size={32} />
                </button>
                
                <div className="lightbox-caption">
                  <p>{selectedPhoto.caption}</p>
                  <span className="photo-counter">
                    {currentIndex + 1} / {filteredPhotos.length}
                  </span>
                </div>
              </motion.div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default PhotoGallery;
