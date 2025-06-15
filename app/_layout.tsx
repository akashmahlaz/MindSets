import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ChatProvider } from "@/context/ChatContext";
import { StreamProvider } from "@/context/StreamContext";
import { VideoProvider } from "@/context/VideoContext";
import { Slot, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
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

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ChatProvider>
          <OverlayProvider>
            <StreamProvider>
              <VideoProvider>
                <AuthGate>
                  <Slot />
                </AuthGate>
              </VideoProvider>
            </StreamProvider>
          </OverlayProvider>
        </ChatProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  // This component checks if the user is authenticated
  const { user, loading } = useAuth();
  const router = useRouter();

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
      <GestureHandlerRootView style={{ flex: 1 }}>
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
