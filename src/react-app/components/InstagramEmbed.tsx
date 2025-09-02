import React, { useEffect, useRef, useState } from 'react';
import { metaSDK } from '../utils/metaSdk';

interface InstagramEmbedProps {
  url: string;
  captioned?: boolean;
  maxWidth?: number;
  skeletonHeight?: number;
}

const InstagramEmbed: React.FC<InstagramEmbedProps> = ({
  url,
  captioned = false,
  maxWidth = 540,
  skeletonHeight = 400
}) => {
  const embedRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInstagram = async () => {
      try {
        await metaSDK.loadInstagramEmbed();
        await metaSDK.processInstagramEmbeds();
        setIsLoaded(true);
      } catch (err) {
        setError('Failed to load Instagram post');
        console.error('Instagram embed error:', err);
      }
    };

    loadInstagram();
  }, [url]);

  if (error) {
    return (
      <div className="instagram-embed-error">
        <p>Unable to load Instagram post</p>
        <a href={url} target="_blank" rel="noopener noreferrer">
          View on Instagram
        </a>
      </div>
    );
  }

  return (
    <div className="instagram-embed-container">
      {!isLoaded && (
        <div className="embed-loading" style={{ height: skeletonHeight }}>
          <div className="loading-spinner"></div>
          <p>Loading Instagram post...</p>
        </div>
      )}
      
      <div ref={embedRef}>
        <blockquote
          className="instagram-media"
          data-instgrm-permalink={url}
          data-instgrm-version="14"
          data-instgrm-captioned={captioned}
          style={{
            background: '#FFF',
            border: '0',
            borderRadius: '3px',
            boxShadow: '0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)',
            margin: '1px',
            maxWidth: `${maxWidth}px`,
            minWidth: '326px',
            padding: '0',
            width: '99.375%'
          }}
        />
      </div>
    </div>
  );
};

export default InstagramEmbed;