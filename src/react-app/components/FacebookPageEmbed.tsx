import React from 'react';
import FacebookPage from './FacebookPage';
import { LuFacebook, LuExternalLink } from 'react-icons/lu';

interface FacebookPageEmbedProps {
  pageUrl: string;
  showTimeline?: boolean;
  showEvents?: boolean;
  showMessages?: boolean;
  height?: number;
  title?: string;
}

const FacebookPageEmbed: React.FC<FacebookPageEmbedProps> = ({
  pageUrl,
  showTimeline = true,
  showEvents = false,
  showMessages = false,
  height = 500,
  title = "Facebook"
}) => {
  // Build tabs string based on props
  const tabs = [
    showTimeline && 'timeline',
    showEvents && 'events', 
    showMessages && 'messages'
  ].filter(Boolean).join(',') || 'timeline';

  return (
    <div className="facebook-embed-wrapper">
      <div className="embed-header">
        <div className="platform-badge">
          <LuFacebook size={16} />
          <span>{title}</span>
        </div>
        <a
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost"
        >
          <LuExternalLink size={16} />
          <span>View on Facebook</span>
        </a>
      </div>
      
      <FacebookPage
        pageUrl={pageUrl}
        tabs={tabs}
        height={height}
        width={340}
        adaptContainerWidth={true}
        smallHeader={false}
        hideCover={false}
        showFacepile={true}
        hideCta={false}
      />
    </div>
  );
};

export default FacebookPageEmbed;