import React from 'react';

const TikTokEmbed: React.FC<{ url: string }> = ({ url }) => {
  return (
    <blockquote
      className="tiktok-embed"
      cite={url}
      data-video-id={url.split('/').pop()}
      style={{ maxWidth: '605px', minWidth: '325px' }}
    >
      <section></section>
    </blockquote>
  );
};

export default TikTokEmbed;
