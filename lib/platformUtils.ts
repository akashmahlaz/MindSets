import { Platform } from 'react-native';

// Check if we're in a native environment where WebRTC is available
export const isNativePlatform = Platform.OS === 'ios' || Platform.OS === 'android';

// Check if we're in a server-side rendering context
export const isSSR = typeof window === 'undefined' || Platform.OS === 'web';

// Safely import video components only on native platforms
export const conditionalVideoImport = async () => {
  if (isNativePlatform && !isSSR) {
    try {
      const videoModule = await import('@stream-io/video-react-native-sdk');
      return videoModule;
    } catch (error) {
      console.warn('Failed to load video SDK:', error);
      return null;
    }
  }
  return null;
};

// Mock video client for non-native platforms
export const createMockVideoClient = () => ({
  connectUser: async () => ({ success: false }),
  disconnectUser: async () => {},
  call: () => ({
    create: async () => ({ success: false }),
    join: async () => ({ success: false }),
    leave: async () => ({ success: false }),
  }),
});
