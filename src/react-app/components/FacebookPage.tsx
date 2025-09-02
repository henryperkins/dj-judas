import React, { useEffect, useRef, useState } from 'react';
import { metaSDK } from '../utils/metaSdk';
import './index.css';

interface FacebookPageProps {
  pageUrl: string;
  tabs?: 'timeline' | 'events' | 'messages' | string;
  width?: number;
  height?: number;
  smallHeader?: boolean;
  hideCover?: boolean;
  showFacepile?: boolean;
  appId?: string;
}

const FacebookPage: React.FC<FacebookPageProps> = ({
  pageUrl,
  tabs = 'timeline',
  width = 500,
  height = 500,
  smallHeader = false,
  hideCover = false,
  showFacepile = true,
  appId: _appId
}) => {
  const pageRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const loadPage = async () => {
      try {
        await metaSDK.loadFacebookSDK();
        // Add a small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (mounted && pageRef.current) {
          await metaSDK.parseFBML(pageRef.current);
          setIsLoaded(true);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load Facebook page');
          console.warn('Facebook page load error (non-critical):', err);
        }
      }
    };

    loadPage();
    
    return () => {
      mounted = false;
    };
  }, [pageUrl]);

  if (error) {
    return (
      <div className="facebook-page-error">
        <p>Unable to load Facebook page</p>
        <a href={pageUrl} target="_blank" rel="noopener noreferrer">
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
          <p>Loading Facebook page...</p>
        </div>
      )}
      
      <div ref={pageRef}>
        <div
          className="fb-page"
          data-href={pageUrl}
          data-tabs={tabs}
          data-width={width}
          data-height={height}
          data-small-header={smallHeader}
          data-adapt-container-width="true"
          data-hide-cover={hideCover}
          data-show-facepile={showFacepile}
          data-lazy="true"
        />
      </div>
    </div>
  );
};

export default FacebookPage;
