import React from 'react';

const TwitterEmbed: React.FC<{ url: string }> = ({ url }) => {
  return (
    <blockquote className="twitter-tweet">
      <a href={url}></a>
    </blockquote>
  );
};

export default TwitterEmbed;
