import React, { useEffect, useRef, useState } from 'react';
import { metaSDK } from '../utils/metaSdk';
import './index.css';

interface FacebookVideoProps {
  href: string; // Facebook video URL
  appId?: string; // Optional app ID override
  width?: number;
  height?: number;
  allowfullscreen?: boolean;
  autoplay?: boolean;
  showCaptions?: boolean;
}

const FacebookVideo: React.FC<FacebookVideoProps> = ({
  href,
  appId: _appId,
  width = 500,
  height = 280,
  allowfullscreen = true,
  autoplay = false,
  showCaptions = true
}) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const loadVideo = async () => {
      try {
        await metaSDK.loadFacebookSDK();
        // Add a small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (mounted && videoRef.current) {
          await metaSDK.parseFBML(videoRef.current);
          setIsLoaded(true);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load Facebook video');
          console.warn('Facebook video load error (non-critical):', err);
        }
      }
    };

    loadVideo();
    
    return () => {
      mounted = false;
    };
  }, [href]);

  if (error) {
    return (
      <div className="facebook-video-error">
        <p>Unable to load Facebook video</p>
        <a href={href} target="_blank" rel="noopener noreferrer">
          View on Facebook
        </a>
      </div>
    );
  }

  return (
    <div className="facebook-embed-container">
      {!isLoaded && (
        <div className="embed-loading">
          <div className="spinner"></div>
          <p>Loading Facebook video...</p>
        </div>
      )}
      
      <div ref={videoRef}>
        <div
          className="fb-video"
          data-href={href}
          data-width={width}
          data-height={height}
          data-allowfullscreen={allowfullscreen}
          data-autoplay={autoplay}
          data-show-captions={showCaptions}
        />
      </div>
    </div>
  );
};

export default FacebookVideo;
