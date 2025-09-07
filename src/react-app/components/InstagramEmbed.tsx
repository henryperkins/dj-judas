import React, { useState, useEffect, useRef } from 'react';
import { LuInstagram, LuExternalLink, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { metaSDK, processInstagramEmbeds } from '../utils/metaSdk';

interface InstagramEmbedProps {
  url: string;              // Single Instagram permalink
  urls?: string[];          // Optional: multiple permalinks to show as carousel
  maxWidth?: number;
  hideCaptions?: boolean;
  skeletonHeight?: number;
}

// Simple in-memory cache to avoid redundant fetches
interface OEmbedData {
  html: string;
  author_name: string;
  title?: string;
}
const oEmbedCache = new Map<string, OEmbedData>();

const InstagramEmbed: React.FC<InstagramEmbedProps> = ({
  url,
  urls,
  maxWidth = 540,
  hideCaptions = false,
  skeletonHeight = 600
}) => {
  const [embedData, setEmbedData] = useState<OEmbedData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  // Observe container size for responsive maxWidth
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let raf = 0;
    const ro = new ResizeObserver(entries => {
      const w = Math.floor(entries[0].contentRect.width);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setContainerWidth(w));
    });
    ro.observe(el);
    setContainerWidth(Math.floor(el.clientWidth));
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchEmbed = async () => {
      try {
        const list = urls && urls.length > 0 ? urls : [url];
        const currentUrl = list[Math.max(0, Math.min(activeIndex, list.length - 1))];
        const effectiveWidth = Math.min(540, Math.max(320, containerWidth || maxWidth));
        const key = `${currentUrl}|${Math.round(effectiveWidth)}|${hideCaptions}`;

        if (oEmbedCache.has(key)) {
          if (!cancelled) {
            setEmbedData(oEmbedCache.get(key));
            setIsLoaded(true);
          }
          return;
        }

        const params = new URLSearchParams({
          url: currentUrl,
          maxwidth: String(Math.round(effectiveWidth)),
          omitscript: 'true',
          hidecaption: String(hideCaptions)
        });

        const response = await fetch(`/api/instagram/oembed?${params.toString()}`);
        if (!response.ok) throw new Error(`oEmbed fetch failed: ${response.status}`);
        const data = await response.json();
        oEmbedCache.set(key, data);
        if (!cancelled) {
          setEmbedData(data);
          setIsLoaded(true);
        }
      } catch (err) {
        if (!cancelled) setError('Failed to load Instagram post');
        console.error('Instagram embed error:', err);
      }
    };

    fetchEmbed();
    return () => { cancelled = true; };
  }, [url, urls, activeIndex, containerWidth, maxWidth, hideCaptions]);

  useEffect(() => {
    let active = true;
    const process = async () => {
      if (!isLoaded || !embedData || !containerRef.current) return;
      await metaSDK.loadInstagramEmbed();
      if (active) await processInstagramEmbeds();
    };
    process();
    return () => { active = false; };
  }, [isLoaded, embedData]);

  if (error) {
    return (
      <div className="instagram-embed-error">
        <p>{error}</p>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          View on Instagram
        </a>
      </div>
    );
  }

  const hasCarousel = Array.isArray(urls) && urls.length > 1;
  const goPrev = () => setActiveIndex(i => Math.max(0, i - 1));
  const goNext = () => setActiveIndex(i => Math.min((urls?.length || 1) - 1, i + 1));

  return (
    <div className="instagram-embed-wrapper">
      <div className="embed-header">
        <div className="platform-badge">
          <LuInstagram size={16} />
          <span>Instagram</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost"
        >
          <LuExternalLink size={16} />
          <span>View on Instagram</span>
        </a>
      </div>
      
      <div className={`instagram-embed-container${hasCarousel ? ' has-carousel' : ''}`} ref={containerRef}>
        {!isLoaded && (
          <div className="embed-loading" style={{ height: skeletonHeight }}>
            <div className="spinner"></div>
            <p>Loading Instagram post...</p>
          </div>
        )}
        
        {isLoaded && embedData && (
          <div 
            className="instagram-embed-content"
            dangerouslySetInnerHTML={{ __html: embedData.html }} 
          />
        )}

        {hasCarousel && (
          <div className="ig-carousel-nav">
            <button className="nav prev" onClick={goPrev} aria-label="Previous post" disabled={activeIndex === 0}>
              <LuChevronLeft size={18} />
            </button>
            <div className="dots" aria-label="Slide position">
              {urls!.map((_, i) => (
                <span key={i} className={`dot ${i === activeIndex ? 'active' : ''}`} />
              ))}
            </div>
            <button className="nav next" onClick={goNext} aria-label="Next post" disabled={activeIndex === (urls!.length - 1)}>
              <LuChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
      
      {isLoaded && embedData && (
        <div className="embed-metadata">
          <p className="author-name">{embedData.author_name}</p>
          {embedData.title && (
            <p className="post-title">{embedData.title}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default InstagramEmbed;
