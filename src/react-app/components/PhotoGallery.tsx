import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dialog as UIDialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog';
import { LuX, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  type DragHandler,
} from 'framer-motion';

/* ──────────────────────────────────
 * Mock data
 * ────────────────────────────────── */

interface Photo {
  id: number;
  src: string;
  alt: string;
  caption: string;
  category: string;
}

const photos: Photo[] = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    alt: 'Live Performance at Gary Gospel Fest',
    caption: 'Gary Gospel Fest 2024 - Main Stage Performance',
    category: 'worship',
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400',
    alt: 'Voices of Judah Choir Practice',
    caption: 'Thursday Night Rehearsal at Greater Faith Community',
    category: 'worship',
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=400',
    alt: 'Community Outreach in Gary',
    caption: 'Gary Community Outreach - Feeding the Homeless',
    category: 'community',
  },
  {
    id: 4,
    src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    alt: 'Studio Recording Session',
    caption: 'Recording "I Love to Praise Him" at Chicago Studios',
    category: 'recording',
  },
  {
    id: 5,
    src: 'https://images.unsplash.com/photo-1529636644619-cf0d5a34e679?w=400',
    alt: 'Sunday Morning Worship',
    caption: 'Sunday Worship Service - Victory Temple Church',
    category: 'worship',
  },
  {
    id: 6,
    src: 'https://images.unsplash.com/photo-1477281765962-ef34e8bb0967?w=400',
    alt: 'Youth Choir Training',
    caption: 'Northwest Indiana Youth Choir Workshop 2024',
    category: 'youth choir',
  },
];

const categories = ['all', 'worship', 'youth choir', 'community', 'recording'];

/* ──────────────────────────────────
 * Helpers
 * ────────────────────────────────── */

function buildSrcSet(url: string): string {
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
}

/* ──────────────────────────────────
 * Component
 * ────────────────────────────────── */

const PhotoGallery: React.FC = () => {
  /* ───── State ───── */
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentIndex, setCurrentIndex] = useState<number | null>(null); // one source of truth

  /* ───── Derived data ───── */
  const filteredPhotos = useMemo(
    () =>
      selectedCategory === 'all'
        ? photos
        : photos.filter((p) => p.category === selectedCategory),
    [selectedCategory]
  );

  const selectedPhoto =
    currentIndex == null ? null : filteredPhotos[currentIndex];

  /* ───── Motion values ───── */
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);

  /* ───── Touch refs ───── */
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  /* ───── Helpers ───── */
  const openLightbox = (photo: Photo) => {
    const idx = filteredPhotos.findIndex((p) => p.id === photo.id);
    setCurrentIndex(idx === -1 ? null : idx);
  };

  const nextPhoto = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev == null) return prev;
      return (prev + 1) % filteredPhotos.length;
    });
  }, [filteredPhotos.length]);

  const prevPhoto = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev == null) return prev;
      return (prev - 1 + filteredPhotos.length) % filteredPhotos.length;
    });
  }, [filteredPhotos.length]);

  /* ───── Gesture handlers ───── */
  const handleDragEnd: DragHandler = (_, info) => {
    const threshold = 50;
    if (info.offset.x > threshold) prevPhoto();
    else if (info.offset.x < -threshold) nextPhoto();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current == null || touchEndX.current == null) return;

    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) nextPhoto();
    if (distance < -50) prevPhoto();

    touchStartX.current = touchEndX.current = null;
  };

  /* ───── Keyboard navigation ───── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentIndex == null) return;
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'Escape') setCurrentIndex(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, nextPhoto, prevPhoto]);

  /* ───── Render ───── */
  return (
    <div className="photo-gallery">
      {/* ───────────────── Header ───────────────── */}
      <header className="gallery-header">
        <h2 className="text-3xl font-bold">Gallery</h2>
        <p className="text-muted-foreground">
          Capturing moments of worship, ministry, and community impact
        </p>
      </header>

      {/* ───────────────── Category filters ───────────────── */}
      <div className="flex flex-wrap gap-2 my-6">
        {categories.map((category) => {
          const active = selectedCategory === category;
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/70'
                }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          );
        })}
      </div>

      {/* ───────────────── Photo grid ───────────────── */}
      <motion.div className="grid gap-4 md:grid-cols-3">
        <AnimatePresence>
          {filteredPhotos.map((photo) => (
            <motion.div
              key={photo.id}
              layout
              className="relative overflow-hidden rounded-md shadow-sm cursor-pointer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openLightbox(photo)}
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
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-black/20 to-transparent p-2">
                <p className="text-xs text-white">{photo.caption}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* ───────────────── Lightbox ───────────────── */}
      <UIDialog
        open={currentIndex != null}
        onOpenChange={(open) => !open && setCurrentIndex(null)}
      >
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          <DialogContent className="fixed inset-0 flex items-center justify-center p-4">
            <DialogClose
              aria-label="Close"
              className="absolute top-4 right-4 text-white hover:text-red-400 focus:outline-none"
            >
              <LuX size={28} />
            </DialogClose>

            {selectedPhoto && (
              <motion.div
                className="relative flex items-center gap-3 select-none"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ x, opacity, touchAction: 'pan-y' }}
                dragMomentum={false}
              >
                {/* Prev button */}
                <button
                  onClick={prevPhoto}
                  aria-label="Previous photo"
                  className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
                  style={{ minWidth: 44, minHeight: 44 }}
                >
                  <LuChevronLeft size={32} />
                </button>

                {/* Actual image */}
                <img
                  src={selectedPhoto.src}
                  srcSet={buildSrcSet(selectedPhoto.src)}
                  sizes="90vw"
                  width={800}
                  height={600}
                  alt={selectedPhoto.alt}
                  loading="lazy"
                  decoding="async"
                  className="max-h-[90vh] object-contain pointer-events-none"
                />

                {/* Next button */}
                <button
                  onClick={nextPhoto}
                  aria-label="Next photo"
                  className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
                  style={{ minWidth: 44, minHeight: 44 }}
                >
                  <LuChevronRight size={32} />
                </button>
              </motion.div>
            )}

            {/* Caption + counter */}
            {selectedPhoto && (
              <div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-white space-y-1"
                aria-live="polite"
              >
                <p className="text-sm">{selectedPhoto.caption}</p>
                <span className="text-xs opacity-80">
                  {currentIndex! + 1} / {filteredPhotos.length}
                </span>
              </div>
            )}
          </DialogContent>
        </DialogPortal>
      </UIDialog>
    </div>
  );
};

export default PhotoGallery;
