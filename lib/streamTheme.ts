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
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginVertical: 2,
        maxWidth: '80%',
        alignSelf: 'flex-start',
        shadowColor: isDark ? '#000' : '#ccc',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      textContainer: {
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: isDark ? '#334155' : '#ffffff',
      },
      wrapper: {
        backgroundColor: isDark ? '#334155' : '#ffffff',
      },
      sent: {
        backgroundColor: isDark ? '#176b5c' : '#dcf8c6',
        alignSelf: 'flex-end',
        borderTopLeftRadius: 18,
        borderTopRightRadius: 6,
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 18,
        marginVertical: 2,
        marginLeft: 40,
        marginRight: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        maxWidth: '80%',
        shadowColor: isDark ? '#000' : '#ccc',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      received: {
        backgroundColor: isDark ? '#232d36' : '#fff',
        alignSelf: 'flex-start',
        borderTopLeftRadius: 6,
        borderTopRightRadius: 18,
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 18,
        marginVertical: 2,
        marginLeft: 8,
        marginRight: 40,
        paddingHorizontal: 14,
        paddingVertical: 10,
        maxWidth: '80%',
        shadowColor: isDark ? '#000' : '#ccc',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      text: {
        color: isDark ? '#f8fafc' : '#0f172a',
        fontSize: 16,
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
      backgroundColor: isDark ? '#1e293b' : '#fff',
      borderTopColor: isDark ? '#475569' : '#e2e8f0',
      borderTopWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 8,
      paddingBottom: 16,
      shadowColor: isDark ? '#000' : '#ccc',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.10,
      shadowRadius: 6,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
    },
    inputBox: {
      backgroundColor: isDark ? '#334155' : '#f1f5f9',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      borderRadius: 24,
      borderWidth: 1,
      fontSize: 16,
      maxHeight: 100,
      paddingHorizontal: 16,
      paddingVertical: 10,
      color: isDark ? '#f8fafc' : '#0f172a',
      shadowColor: isDark ? '#000' : '#ccc',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    sendButton: {
      backgroundColor: '#3b82f6',
      borderRadius: 20,
      height: 40,
      width: 40,
      marginLeft: 8,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: isDark ? '#000' : '#ccc',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 2,
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
