import { createContext } from 'react';

export interface SocialSDKConfig {
  meta?: {
    appId?: string;
    pixelId?: string;
    version?: string;
  };
  twitter?: {
    enabled?: boolean;
  };
  tiktok?: {
    enabled?: boolean;
  };
  apple?: {
    developerToken?: string;
  };
  spotify?: {
    clientId?: string;
  };
}

export interface SocialSDKState {
  meta: boolean;
  twitter: boolean;
  tiktok: boolean;
  apple: boolean;
  spotify: boolean;
}

export interface SocialProviderContextType {
  isLoaded: SocialSDKState;
  loadSDK: (platform: keyof SocialSDKState) => Promise<void>;
  config: SocialSDKConfig;
}

export const SocialProviderContext = createContext<SocialProviderContextType | null>(null);
