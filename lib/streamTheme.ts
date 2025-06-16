import { DeepPartial, Theme } from 'stream-chat-expo';

export const getStreamChatTheme = (isDark: boolean): DeepPartial<Theme> => ({
  colors: {
    // Primary colors
    accent_blue: '#3b82f6',
    accent_green: '#10b981',
    accent_red: '#ef4444',
    
    // Background colors
    white: isDark ? '#1e293b' : '#ffffff',
    white_snow: isDark ? '#0f172a' : '#f8fafc',
    grey_gainsboro: isDark ? '#475569' : '#e2e8f0',
    grey_whisper: isDark ? '#334155' : '#f1f5f9',
    
    // Text colors - Enhanced for better visibility
    black: isDark ? '#f8fafc' : '#0f172a',
    grey: isDark ? '#cbd5e1' : '#64748b',
    grey_dark: isDark ? '#e2e8f0' : '#475569',
    
    // Message colors
    blue_alice: isDark ? '#1e40af' : '#eff6ff',
    transparent: 'transparent',
    
    // Border colors
    border: isDark ? '#475569' : '#e2e8f0',
    
    // Overlay colors
    overlay: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
    shadow_icon: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  },  messageSimple: {
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
        backgroundColor: isDark ? '#334155' : '#ffffff',
      },
      wrapper: {
        backgroundColor: isDark ? '#334155' : '#ffffff',
      },
      markdown: {
        text: {
          color: isDark ? '#f8fafc' : '#0f172a',
          fontSize: 16,
        },
        inlineCode: {
          color: isDark ? '#f8fafc' : '#0f172a',
          backgroundColor: isDark ? '#475569' : '#f1f5f9',
        },
      },
    },
    avatarWrapper: {
      container: {
        marginRight: 8,
      },
    },
  },  messageInput: {
    container: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderTopColor: isDark ? '#475569' : '#e2e8f0',
      borderTopWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingBottom: 20, // Extra padding for safe area
    },
    inputBox: {
      backgroundColor: isDark ? '#334155' : '#f1f5f9',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      borderRadius: 24,
      borderWidth: 1,
      fontSize: 16,
      maxHeight: 100,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: isDark ? '#f8fafc' : '#0f172a',
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
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderBottomColor: isDark ? '#334155' : '#f1f5f9',
      borderBottomWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    title: {
      color: isDark ? '#f1f5f9' : '#0f172a',
      fontSize: 16,
      fontWeight: '600',
    },
    message: {
      color: isDark ? '#94a3b8' : '#64748b',
      fontSize: 14,
    },
    date: {
      color: isDark ? '#64748b' : '#94a3b8',
      fontSize: 12,
    },
  },  avatar: {
    BASE_AVATAR_SIZE: 32,
    container: {
      borderRadius: 16,
      backgroundColor: isDark ? '#475569' : '#e2e8f0',
    },
    image: {
      borderRadius: 16,
    },
  },  // Add message list styling
  messageList: {
    container: {
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
    },
  },
  // Add proper message text styling through the colors
  thread: {
    newThread: {
      text: {
        color: isDark ? '#f8fafc' : '#0f172a',
      },
    },
  },
});
