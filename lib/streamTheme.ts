import { DeepPartial, Theme } from 'stream-chat-expo';

export const streamChatTheme: DeepPartial<Theme> = {
  colors: {
    // Primary colors
    accent_blue: '#3b82f6',
    accent_green: '#10b981',
    accent_red: '#ef4444',
    
    // Background colors
    white: '#ffffff',
    white_snow: '#f8fafc',
    grey_gainsboro: '#e2e8f0',
    grey_whisper: '#f1f5f9',
    
    // Text colors
    black: '#0f172a',
    grey: '#64748b',
    grey_dark: '#475569',
    
    // Message colors
    blue_alice: '#eff6ff',
    transparent: 'transparent',
    
    // Border colors
    border: '#e2e8f0',
  },
  messageSimple: {
    content: {
      container: {
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
      },
      textContainer: {
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
      },
      wrapper: {
        backgroundColor: '#ffffff',
      },
    },
    avatarWrapper: {
      container: {
        marginRight: 8,
      },
    },
  },
  messageInput: {
    container: {
      backgroundColor: '#ffffff',
      borderTopColor: '#e2e8f0',
      borderTopWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    inputBox: {
      backgroundColor: '#f1f5f9',
      borderColor: '#e2e8f0',
      borderRadius: 24,
      borderWidth: 1,
      fontSize: 16,
      maxHeight: 100,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    sendButton: {
      backgroundColor: '#3b82f6',
      borderRadius: 20,
      height: 40,
      width: 40,
      marginLeft: 8,
    },
  },
  channelPreview: {
    container: {
      backgroundColor: '#ffffff',
      borderBottomColor: '#f1f5f9',
      borderBottomWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    title: {
      color: '#0f172a',
      fontSize: 16,
      fontWeight: '600',
    },
    message: {
      color: '#64748b',
      fontSize: 14,
    },
    date: {
      color: '#94a3b8',
      fontSize: 12,
    },
  },
  avatar: {
    BASE_AVATAR_SIZE: 32,
    container: {
      borderRadius: 16,
      backgroundColor: '#e2e8f0',
    },
    image: {
      borderRadius: 16,
    },
  },
};
