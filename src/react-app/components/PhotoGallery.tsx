import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './PhotoGallery.css';

interface Photo {
  id: number;
  src: string;
  alt: string;
  caption: string;
  category: string;
}

const photos: Photo[] = [
  { id: 1, src: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', alt: 'Live Performance', caption: 'Annual Gospel Concert 2023', category: 'worship' },
  { id: 2, src: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400', alt: 'Choir Practice', caption: 'Weekly Rehearsal Session', category: 'worship' },
  { id: 3, src: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=400', alt: 'Community Event', caption: 'Community Outreach Program', category: 'community' },
  { id: 4, src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', alt: 'Studio Recording', caption: 'Recording "Great & Mighty"', category: 'recording' },
  { id: 5, src: 'https://images.unsplash.com/photo-1529636644619-cf0d5a34e679?w=400', alt: 'Church Service', caption: 'Sunday Worship Service', category: 'worship' },
  { id: 6, src: 'https://images.unsplash.com/photo-1477281765962-ef34e8bb0967?w=400', alt: 'Youth Ministry', caption: 'Youth Choir Workshop', category: 'youth choir' },
];

const categories = ['all', 'worship', 'youth choir', 'community', 'recording'];

const PhotoGallery: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

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
            >
              <img src={photo.src} alt={photo.alt} />
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
              <>
                <button className="lightbox-nav lightbox-prev" onClick={prevPhoto}>
                  <ChevronLeft size={32} />
                </button>
                
                <img src={selectedPhoto.src} alt={selectedPhoto.alt} />
                
                <button className="lightbox-nav lightbox-next" onClick={nextPhoto}>
                  <ChevronRight size={32} />
                </button>
                
                <div className="lightbox-caption">
                  <p>{selectedPhoto.caption}</p>
                  <span className="photo-counter">
                    {currentIndex + 1} / {filteredPhotos.length}
                  </span>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default PhotoGallery;