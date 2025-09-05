import React from 'react';
import { useFacebookEmbed } from './useFacebookEmbed';

export interface FacebookVideoProps {
  href: string;
  width?: number;
  height?: number;
  allowfullscreen?: boolean;
  autoplay?: boolean;
  showCaptions?: boolean;
  className?: string;
}

const FacebookVideo: React.FC<FacebookVideoProps> = ({
  href,
  width = 500,
  height = 280,
  allowfullscreen = true,
  autoplay = false,
  showCaptions = true,
  className,
}) => {
  const { ref, loaded, error } = useFacebookEmbed('fb-video', [href]);

  if (error) {
    return (
      <div className="text-center text-sm text-red-500">
        <p>{error}</p>
        <a
          className="underline hover:no-underline"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on Facebook
        </a>
      </div>
    );
  }

  return (
    <div className={className}>
      {!loaded && (
        <p className="mb-2 text-xs text-muted-foreground animate-pulse">
          Loading…
        </p>
      )}
      <div ref={ref}>
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
