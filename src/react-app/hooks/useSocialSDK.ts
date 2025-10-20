import { useContext } from 'react';
import { SocialProviderContext } from '../providers/SocialProviderContext';

export const useSocialSDK = () => {
  const context = useContext(SocialProviderContext);
  if (!context) {
    throw new Error('useSocialSDK must be used within a SocialProvider');
  }
  return context;
};
