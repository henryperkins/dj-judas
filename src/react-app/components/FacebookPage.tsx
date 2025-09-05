import React from 'react';
import { useFacebookEmbed } from './useFacebookEmbed';

export interface FacebookPageProps {
  pageUrl: string;
  tabs?: string;          // timeline, events, messages
  width?: number;
  height?: number;
  smallHeader?: boolean;
  hideCover?: boolean;
  showFacepile?: boolean;
  hideCta?: boolean;      // Hide the custom call to action button
  adaptContainerWidth?: boolean;
  className?: string;
}

const FacebookPage: React.FC<FacebookPageProps> = ({
  pageUrl,
  tabs = 'timeline',
  width = 340,
  height = 500,
  smallHeader = false,
  hideCover = false,
  showFacepile = true,
  hideCta = false,
  adaptContainerWidth = true,
  className,
}) => {
  const { ref, loaded, error } = useFacebookEmbed('fb-page', [pageUrl, tabs]);

  if (error) {
    return (
      <div className="facebook-page-error">
        <p>{error}</p>
        <a
          className="text-accent hover:underline"
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on Facebook
        </a>
      </div>
    );
  }

  return (
    <div className={`facebook-page-container ${className || ''}`}>
      {!loaded && (
        <div className="embed-loading">
          <div className="spinner"></div>
          <p>Loading Facebook page...</p>
        </div>
      )}
      <div ref={ref} className="facebook-page-wrapper">
        <div
          className="fb-page"
          data-href={pageUrl}
          data-tabs={tabs}
          data-width={width}
          data-height={height}
          data-small-header={smallHeader}
          data-adapt-container-width={adaptContainerWidth}
          data-hide-cover={hideCover}
          data-show-facepile={showFacepile}
          data-hide-cta={hideCta}
          data-lazy="true"
        />
      </div>
    </div>
  );
};

export default FacebookPage;
