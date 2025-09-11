import React from 'react';
import {
  FaFacebook,
  FaXTwitter,
  FaWhatsapp,
  FaFacebookMessenger
} from 'react-icons/fa6';
import { shareWithTracking } from '../utils/metaSdk';
import { socialMetrics } from '../utils/socialMetrics';
import { addUtm } from '@/react-app/utils/utm';

export interface ShareTarget {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  buildUrl: (baseUrl: string) => string;
  onClick?: (url: string) => Promise<void>;
}

interface ShareButtonProps {
  url: string;
  title?: string;
  description?: string;
  artist?: string;
  tagline?: string;
  utmSource?: string;
  campaign?: string;
  className?: string;
  onShare?: (platformId: string) => void;
  buildUrlFn?: (baseUrl: string, platformId: string) => string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  url,
  title,
  artist = 'DJ Lee & The Voices of Judah',
  tagline = 'Gospel that lifts the room',
  utmSource = 'share',
  campaign,
  className = '',
  onShare,
  buildUrlFn
}) => {
  // Helper to apply consistent UTM logic (falls back to custom buildUrlFn when provided)
  const utm = (base: string, source: string) =>
    buildUrlFn ? buildUrlFn(base, source) : addUtm(base, { source, medium: 'social', campaign: campaign || utmSource });

  const shareText = title || `${artist} – ${tagline}`;
  const shareTargets: ShareTarget[] = [
    {
      id: 'facebook',
      label: 'Facebook',
      icon: FaFacebook,
      color: '#1877F2',
      buildUrl: (base) =>
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          utm(base, 'facebook')
        )}`,
      onClick: async (base) => {
        await shareWithTracking({
          url: utm(base, 'facebook'),
          quote: shareText,
          source: utmSource
        });
      }
    },
    {
      id: 'x',
      label: 'X',
      icon: FaXTwitter,
      color: '#000000',
      buildUrl: (base) =>
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          utm(base, 'x')
        )}&text=${encodeURIComponent(shareText)}`
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: FaWhatsapp,
      color: '#25D366',
      buildUrl: (base) =>
        `https://wa.me/?text=${encodeURIComponent(
          `${shareText}\n${utm(base, 'whatsapp')}`
        )}`
    },
    {
      id: 'messenger',
      label: 'Messenger',
      icon: FaFacebookMessenger,
      color: '#0084FF',
      buildUrl: (base) => {
        const shareLink = utm(base, 'messenger');
        const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
        if (facebookAppId && typeof window !== 'undefined') {
          const params = new URLSearchParams({
            app_id: facebookAppId,
            link: shareLink,
            redirect_uri: window.location.origin
          });
          return `https://www.facebook.com/dialog/send?${params}`;
        }
        return `fb-messenger://share?link=${encodeURIComponent(shareLink)}`;
      }
    }
  ];

  const handleShare = async (target: ShareTarget) => {
    socialMetrics.trackEvent({
      action: 'share_click',
      category: 'social',
      label: target.id,
      platform: target.id
    });

    // Call the onShare callback if provided
    if (onShare) {
      onShare(target.id);
    }

    if (target.onClick) {
      await target.onClick(url);
    } else {
      window.open(target.buildUrl(url), '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`share-buttons ${className}`}>
      {shareTargets.map((target) => (
        <button
          key={target.id}
          aria-label={`Share on ${target.label}`}
          className="share-btn"
          style={{ ['--brand' as keyof React.CSSProperties]: target.color } as React.CSSProperties}
          onClick={() => handleShare(target)}
        >
          <target.icon size={18} />
          <span>{target.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ShareButton;
