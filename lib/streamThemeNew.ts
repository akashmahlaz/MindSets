import { DeepPartial, Theme } from 'stream-chat-expo';

export const getStreamChatTheme = (isDark: boolean): DeepPartial<Theme> => ({
  colors: {
    // Primary colors - iOS style
    accent_blue: '#007AFF',
    accent_green: '#34C759',
    accent_red: '#FF3B30',
    
    // Background colors
    white: isDark ? '#1C1C1E' : '#FFFFFF',
    white_snow: isDark ? '#000000' : '#F2F2F7',
    grey_gainsboro: isDark ? 'transparent' : '#E5E5EA',
    grey_whisper: isDark ? '#2C2C2E' : '#F2F2F7',
    
    // Text colors - High contrast for better readability
    black: isDark ? '#FFFFFF' : '#000000',
    grey: isDark ? '#EBEBF5' : '#3C3C43',
    grey_dark: isDark ? '#FFFFFF' : '#000000',
    
    // Message colors - Make sent messages blue
    blue_alice: '#007AFF', // Use blue for sent messages
    transparent: 'transparent',    // Border colors
    border: isDark ? 'transparent' : '#C6C6C8',
  },
  messageSimple: {
    content: {      container: {
        borderRadius: 18,
        marginVertical: 4,
        maxWidth: '75%',
        shadowColor: isDark ? '#000000' : '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.2 : 0.06,
        shadowRadius: isDark ? 0 : 2,
        elevation: isDark ? 0 : 1,
        // Ensure no borders in container
        borderWidth: 0,
        borderColor: 'transparent',
      },textContainer: {
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
        borderWidth: isDark ? 0 : 0.5,
        borderColor: isDark ? 'transparent' : '#E5E5EA',
        // Explicitly remove border in dark mode
        ...(isDark && {
          borderWidth: 0,
          borderColor: 'transparent',
        }),
      },      wrapper: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderColor: 'transparent',
      },
      markdown: {
        text: {
          color: isDark ? '#FFFFFF' : '#000000',
          fontSize: 16,
          fontWeight: '400',
          lineHeight: 22,
        },
      },
    },
    avatarWrapper: {
      container: {
        marginRight: 12,
        marginTop: 4,
      },
    },
  },
  messageInput: {
    container: {
      backgroundColor: isDark ? '#000000' : '#F2F2F7',
      borderTopColor: 'transparent',
      borderTopWidth: 0,
      paddingHorizontal: 12,
      paddingVertical: 8,
      paddingBottom: 8, // Reduced bottom padding to eliminate gray box
    },
    inputBox: {
      backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
      borderColor: isDark ? '#3A3A3C' : '#E5E5EA',
      borderRadius: 20,
      borderWidth: 1,
      fontSize: 16,
      maxHeight: 100,
      minHeight: 40,
      paddingHorizontal: 16,
      paddingVertical: 10,
      color: isDark ? '#FFFFFF' : '#000000',
      // Remove shadow for minimal look
      shadowColor: undefined,
      shadowOffset: undefined,
      shadowOpacity: undefined,
      shadowRadius: undefined,
      elevation: undefined,
    },
    sendButton: {
      backgroundColor: '#007AFF',
      borderRadius: 18,
      height: 36,
      width: 36,
      marginLeft: 8,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
  },
  channelPreview: {
    container: {
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderBottomColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderBottomWidth: 0.5,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    title: {
      color: isDark ? '#FFFFFF' : '#000000',
      fontSize: 17,
      fontWeight: '600',
    },
    message: {
      color: isDark ? '#EBEBF5' : '#3C3C43',
      fontSize: 15,
    },
    date: {
      color: isDark ? '#8E8E93' : '#8E8E93',
      fontSize: 13,
    },
  },
  avatar: {
    BASE_AVATAR_SIZE: 32,
    container: {
      borderRadius: 16,
      backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA',
    },
    image: {
      borderRadius: 16,
    },  },
  messageList: {
    container: {
      backgroundColor: isDark ? '#000000' : '#F2F2F7',
      paddingHorizontal: 12,
      paddingTop: 8,
    },
  },
});
