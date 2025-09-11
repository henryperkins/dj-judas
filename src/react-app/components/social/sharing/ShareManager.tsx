import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  LuShare2, 
  LuCopy, 
  LuExternalLink, 
  LuQrCode,
  LuCheck,
  LuMusic,
  LuSmartphone
} from 'react-icons/lu';
import ShareButton from './ShareButton';
import QrShareCard from './QrShareCard';
import { socialMetrics } from '../utils/socialMetrics';
import { 
  PLATFORM_CONFIG, 
  getPlatformWebLink,
  type PlatformId
} from '@/react-app/config/platforms';
import {
  buildTrackedUrl,
  getCanonicalUrl,
  getPageMetadata,
  copyToClipboard,
  supportsNativeShare,
  nativeShare
} from './shareUtils';

export interface DeepLink {
  id: string;
  label: string;
  url: string;
  platform?: PlatformId;
  icon?: React.ReactNode;
}

export interface ShareManagerProps {
  url?: string;
  title?: string;
  description?: string;
  artist?: string;
  tagline?: string;
  campaign?: string;
  showPlatforms?: boolean;
  showQr?: boolean;
  showDeepLinks?: boolean;
  deepLinks?: DeepLink[];
  onEvent?: (event: {
    type: string;
    platform?: string;
    url?: string;
    method?: string;
  }) => void;
  className?: string;
  layout?: 'grid' | 'stack' | 'auto';
}

const ShareManager: React.FC<ShareManagerProps> = ({
  url,
  title,
  description,
  artist,
  tagline,
  campaign = 'share',
  showPlatforms = true,
  showQr = true,
  showDeepLinks = true,
  deepLinks,
  onEvent,
  className = '',
  layout = 'auto'
}) => {
  const [qrVisible, setQrVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  // Get canonical URL and metadata
  const canonicalUrl = useMemo(() => url || getCanonicalUrl(), [url]);
  const metadata = useMemo(() => getPageMetadata(), []);
  const shareTitle = title || metadata.title || 'Check this out';
  const shareDescription = description || metadata.description || '';
  
  // Build share URL with UTM params
  const shareUrl = useMemo(() => {
    return buildTrackedUrl(canonicalUrl, {
      source: 'share',
      medium: 'social',
      campaign
    });
  }, [canonicalUrl, campaign]);
  
  // Check native share support
  const hasNativeShare = supportsNativeShare();
  
  // Default deep links if not provided
  const defaultDeepLinks: DeepLink[] = useMemo(() => {
    if (deepLinks) return deepLinks;
    
    const links: DeepLink[] = [];
    
    // Add Spotify link if available
    const spotifyUrl = getPlatformWebLink('spotify');
    if (spotifyUrl) {
      links.push({
        id: 'spotify',
        label: 'Listen on Spotify',
        url: spotifyUrl,
        platform: 'spotify',
        icon: <LuMusic size={18} />
      });
    }
    
    // Add Apple Music link if available
    const appleMusicUrl = getPlatformWebLink('appleMusic');
    if (appleMusicUrl) {
      links.push({
        id: 'apple-music',
        label: 'Listen on Apple Music',
        url: appleMusicUrl,
        platform: 'appleMusic',
        icon: <LuMusic size={18} />
      });
    }
    
    return links;
  }, [deepLinks]);
  
  // Track initial mount
  useEffect(() => {
    socialMetrics.trackSocialInteraction('share_manager', 'init', {
      campaign,
      has_native_share: hasNativeShare
    });
    
    if (onEvent) {
      onEvent({ type: 'init', method: 'share_manager' });
    }
  }, [campaign, hasNativeShare, onEvent]);
  
  // Handle interactions
  const markInteracted = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  }, [hasInteracted]);
  
  // Handle native share
  const handleNativeShare = useCallback(async () => {
    markInteracted();
    
    socialMetrics.trackSocialInteraction('share_manager', 'native_share_attempt', {
      campaign,
      url: shareUrl
    });
    
    const success = await nativeShare({
      title: shareTitle,
      text: shareDescription,
      url: shareUrl
    });
    
    if (success) {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
      
      socialMetrics.trackSocialInteraction('share_manager', 'native_share_complete', {
        campaign,
        url: shareUrl
      });
      
      if (onEvent) {
        onEvent({ 
          type: 'share_complete', 
          method: 'native',
          url: shareUrl 
        });
      }
    }
  }, [markInteracted, campaign, shareUrl, shareTitle, shareDescription, onEvent]);
  
  // Handle copy link
  const handleCopyLink = useCallback(async () => {
    markInteracted();
    
    const success = await copyToClipboard(shareUrl);
    
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      
      socialMetrics.trackSocialInteraction('share_manager', 'copy_link', {
        campaign,
        url: shareUrl
      });
      
      if (onEvent) {
        onEvent({ 
          type: 'copy_link', 
          url: shareUrl 
        });
      }
    }
  }, [markInteracted, shareUrl, campaign, onEvent]);
  
  // Handle open link
  const handleOpenLink = useCallback(() => {
    markInteracted();
    
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    
    socialMetrics.trackSocialInteraction('share_manager', 'open_link', {
      campaign,
      url: shareUrl
    });
    
    if (onEvent) {
      onEvent({ 
        type: 'open_link', 
        url: shareUrl 
      });
    }
  }, [markInteracted, shareUrl, campaign, onEvent]);
  
  // Handle QR toggle
  const handleQrToggle = useCallback(() => {
    markInteracted();
    
    const newState = !qrVisible;
    setQrVisible(newState);
    
    socialMetrics.trackSocialInteraction('share_manager', 'qr_toggle', {
      campaign,
      state: newState ? 'open' : 'close'
    });
    
    if (newState) {
      socialMetrics.trackSocialInteraction('share_manager', 'share_qr_display', {
        campaign,
        url: shareUrl
      });
    }
    
    if (onEvent) {
      onEvent({ 
        type: 'qr_toggle', 
        platform: 'qr',
        method: newState ? 'show' : 'hide'
      });
    }
  }, [markInteracted, qrVisible, campaign, shareUrl, onEvent]);
  
  // Handle deep link click
  const handleDeepLinkClick = useCallback((link: DeepLink) => {
    markInteracted();
    
    const trackedUrl = buildTrackedUrl(link.url, {
      source: link.platform || link.id,
      medium: 'deeplink',
      campaign
    });
    
    window.open(trackedUrl, '_blank', 'noopener,noreferrer');
    
    socialMetrics.trackSocialInteraction('share_manager', 'deeplink_click', {
      campaign,
      platform: link.platform || link.id,
      url: trackedUrl
    });
    
    if (onEvent) {
      onEvent({ 
        type: 'deeplink_click', 
        platform: link.platform || link.id,
        url: trackedUrl 
      });
    }
  }, [markInteracted, campaign, onEvent]);
  
  // Handle platform share (from ShareButton)
  const handlePlatformShare = useCallback((platformId: string) => {
    markInteracted();
    
    if (onEvent) {
      onEvent({ 
        type: 'share_click', 
        platform: platformId,
        url: shareUrl 
      });
    }
  }, [markInteracted, shareUrl, onEvent]);
  
  // Determine layout class
  const layoutClass = layout === 'auto' 
    ? 'share-manager-auto' 
    : layout === 'grid' 
    ? 'share-manager-grid' 
    : 'share-manager-stack';
  
  return (
    <div 
      className={`share-manager ${layoutClass} ${className}`}
      role="group"
      aria-labelledby="share-heading"
    >
      <h3 id="share-heading" className="share-heading">Share</h3>
      
      {/* Primary Actions */}
      <div className="share-primary-actions">
        {hasNativeShare && (
          <button
            className="share-action-btn share-native"
            onClick={handleNativeShare}
            aria-label="Share using device share menu"
          >
            <LuShare2 size={18} />
            <span>{shareSuccess ? 'Shared!' : 'Share'}</span>
          </button>
        )}
        
        <button
          className="share-action-btn share-copy"
          onClick={handleCopyLink}
          aria-label="Copy link to clipboard"
        >
          {copySuccess ? <LuCheck size={18} /> : <LuCopy size={18} />}
          <span>{copySuccess ? 'Copied!' : 'Copy Link'}</span>
        </button>
        
        <button
          className="share-action-btn share-open"
          onClick={handleOpenLink}
          aria-label="Open link in new tab"
        >
          <LuExternalLink size={18} />
          <span>Open</span>
        </button>
        
        {showQr && (
          <button
            className="share-action-btn share-qr-toggle"
            onClick={handleQrToggle}
            aria-label="Toggle QR code"
            aria-expanded={qrVisible}
            aria-controls="share-qr-region"
          >
            <LuQrCode size={18} />
            <span>QR Code</span>
          </button>
        )}
      </div>
      
      {/* Platform Buttons */}
      {showPlatforms && (
        <div className="share-platforms">
          <ShareButton
            url={shareUrl}
            title={shareTitle}
            artist={artist}
            tagline={tagline}
            campaign={campaign}
            onShare={handlePlatformShare}
            className="share-platform-buttons"
          />
        </div>
      )}
      
      {/* Deep Links */}
      {showDeepLinks && defaultDeepLinks.length > 0 && (
        <div className="share-deep-links">
          <h4 className="deep-links-heading">Listen & Follow</h4>
          <div className="deep-links-list">
            {defaultDeepLinks.map(link => (
              <button
                key={link.id}
                className="deep-link-btn"
                onClick={() => handleDeepLinkClick(link)}
                aria-label={link.label}
                style={{
                  '--platform-color': link.platform 
                    ? PLATFORM_CONFIG[link.platform].color 
                    : undefined
                } as React.CSSProperties}
              >
                {link.icon || <LuSmartphone size={18} />}
                <span>{link.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* QR Code */}
      {showQr && qrVisible && (
        <div 
          id="share-qr-region"
          className="share-qr-region"
          aria-live="polite"
        >
          <QrShareCard
            url={shareUrl}
            label={shareTitle}
          />
        </div>
      )}
    </div>
  );
};

export default ShareManager;