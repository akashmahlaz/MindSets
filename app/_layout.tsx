import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ChatProvider } from "@/context/ChatContext";
import { StreamProvider } from "@/context/StreamContext";
import { VideoProvider } from "@/context/VideoContext";
import { useColorScheme } from '@/lib/useColorScheme';
import { Slot, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import "./global.css";

// Initialize push notifications for Stream Video
import "@/lib/initializePushNotifications";

// Suppress specific warnings from Stream Video SDK
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    (args[0].includes('Text strings must be rendered within a <Text> component') ||
      args[0].includes('useChannelsContext hook was called outside'))
  ) {
    return; // Suppress these specific warnings
  }
  originalWarn.apply(console, args);
};

// Import the necessary components from stream-chat-react-native
import { OverlayProvider } from 'stream-chat-react-native';

function StreamChatWrapper({ children }: { children: React.ReactNode }) {
  const { isDarkColorScheme } = useColorScheme();
  
  const darkTheme = {
    colors: {
      bg_gradient_end: '#000000',
      bg_gradient_start: '#000000',
      black: '#000000',
      blue_alice: '#1a1a1a',
      border: '#242424',
      grey: '#666666',
      grey_gainsboro: '#2a2a2a',
      grey_whisper: '#1a1a1a',
      icon: '#ffffff',
      modal: '#000000',
      overlay: '#000000',
      shadow_icon: '#000000',
      targetedMessageBackground: '#1a1a1a',
      text: '#ffffff',
      white: '#000000',
      white_smoke: '#1a1a1a',
      white_snow: '#1a1a1a',
    },
  };

  const lightTheme = {
    colors: {
      bg_gradient_end: '#ffffff',
      bg_gradient_start: '#ffffff',
      black: '#000000',
      blue_alice: '#f0f4f7',
      border: '#e0e0e0',
      grey: '#7a7a7a',
      grey_gainsboro: '#dbdbdb',
      grey_whisper: '#ecebeb',
      icon: '#000000',
      modal: '#ffffff',
      overlay: '#ffffff',
      shadow_icon: '#00000080',
      targetedMessageBackground: '#faf9fa',
      text: '#000000',
      white: '#ffffff',
      white_smoke: '#f8f8f8',
      white_snow: '#fcfcfc',
    },
  };

  return (
    <OverlayProvider value={{ style: isDarkColorScheme ? darkTheme : lightTheme }}>
      {children}
    </OverlayProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ChatProvider>
          <StreamChatWrapper>
            <StreamProvider>
              <VideoProvider>
                <AuthGate>
                  <Slot />
                </AuthGate>
              </VideoProvider>
            </StreamProvider>
          </StreamChatWrapper>
        </ChatProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  // This component checks if the user is authenticated
  const { user, loading } = useAuth();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();

  useEffect(() => {
    if (loading) return; // Don't navigate while loading

    if (!user) {
      router.replace('/(auth)/sign-in');
    } else {
      router.replace('/');
    }
  }, [user, loading, router]);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>        <StatusBar 
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          backgroundColor={isDarkColorScheme ? "#000000" : "#ffffff"}
        />
        <StreamProvider>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
          </View>
        </StreamProvider>
      </GestureHandlerRootView>
    );
  }

  return <>{children}</>;
}
