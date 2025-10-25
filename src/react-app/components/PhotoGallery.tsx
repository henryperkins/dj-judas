import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Dialog as UIDialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { LuX, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useReducedMotion,
  type DragHandler,
} from 'framer-motion';
import { localGalleryPhotos } from '@/react-app/data/localGalleryPhotos';

/* ──────────────────────────────────
 * Mock data
 * ────────────────────────────────── */

interface Photo {
  id: string;
  src: string;
  alt: string;
  caption: string;
  category: string;
  sort_order?: number;
  is_published?: number;
  width?: number;
  height?: number;
  file_size?: number;
  r2_key?: string;
  created_at?: string;
  updated_at?: string;
}

const defaultPhotos: Photo[] = localGalleryPhotos;

// Default categories if we cannot load from JSON
const defaultCategories: string[] = [
  'all',
  ...Array.from(new Set(localGalleryPhotos.map((photo) => photo.category))),
];

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
  const [items, setItems] = useState<Photo[]>(defaultPhotos);

  /* ───── Derived data ───── */
  const categories = useMemo<string[]>(() => {
    const fromData = Array.from(new Set(items.map((p) => p.category)));
    return fromData.length > 0 ? ['all', ...fromData] : defaultCategories;
  }, [items]);

  const filteredPhotos = useMemo(
    () =>
      selectedCategory === 'all'
        ? items
        : items.filter((p) => p.category === selectedCategory),
    [items, selectedCategory]
  );

  const selectedPhoto =
    currentIndex == null ? null : filteredPhotos[currentIndex];

  /* ───── Motion values ───── */
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);
  const prefersReducedMotion = useReducedMotion();

  /* ───── Touch refs ───── */
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  /* ───── Helpers ───── */
  const toTitleCase = (s: string) => s.replace(/\b\w/g, (m) => m.toUpperCase());
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

  /* ───── Data loading from API ───── */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/gallery');
        if (!res.ok) return;
        const data = await res.json() as { photos?: Photo[] };
        if (Array.isArray(data.photos) && !cancelled) {
          setItems(data.photos);
        }
      } catch {
        // ignore; keep defaults
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  /* ───── Keep index valid on filter/data change ───── */
  useEffect(() => {
    if (currentIndex == null) return;
    if (filteredPhotos.length === 0) {
      setCurrentIndex(null);
      return;
    }
    if (currentIndex >= filteredPhotos.length) {
      setCurrentIndex(filteredPhotos.length - 1);
    }
  }, [filteredPhotos.length, currentIndex]);

  /* ───── Reset drag + preload neighbors on change ───── */
  useEffect(() => {
    if (currentIndex == null || filteredPhotos.length === 0) return;
    // Reset drag offset
    x.set(0);
    // Preload neighbors
    const prevIdx = (currentIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
    const nextIdx = (currentIndex + 1) % filteredPhotos.length;
    [prevIdx, nextIdx].forEach((i) => {
      const src = filteredPhotos[i]?.src;
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, [currentIndex, filteredPhotos, x]);

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
      {/* Header is already provided by the parent section; avoid duplicate heading here. */}

      {/* ───────────────── Category filters ───────────────── */}
      <div className="flex flex-wrap gap-2 my-6" role="group" aria-label="Filter gallery by category">
        {categories.map((category) => {
          const active = selectedCategory === category;
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              aria-pressed={active}
              className={`rounded-md px-3 py-2 min-h-9 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/70'
                }`}
            >
              {toTitleCase(category)}
            </button>
          );
        })}
      </div>

      {/* ───────────────── Photo grid ───────────────── */}
      <motion.div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
        <AnimatePresence>
          {filteredPhotos.map((photo) => (
            <motion.button
              key={photo.id}
              layout
              className="relative overflow-hidden rounded-md shadow-sm cursor-pointer aspect-[4/3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              type="button"
              initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.9 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.9 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25 }}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openLightbox(photo)}
              aria-label={photo.alt || photo.caption}
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
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/50 to-transparent p-2">
                <p className="text-xs text-white line-clamp-2 bg-black/80 px-2 py-1 rounded">{photo.caption}</p>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* ───────────────── Lightbox ───────────────── */}
      <UIDialog
        open={currentIndex != null}
        onOpenChange={(open) => !open && setCurrentIndex(null)}
      >
        <DialogContent
          fullscreen
          overlayClassName="fixed inset-0 bg-black/80 backdrop-blur-sm"
          className="flex items-center justify-center p-4"
        >
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
                  className="max-h-[90vh] object-contain"
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
      </UIDialog>
    </div>
  );
};

export default PhotoGallery;
