import { AuthProvider, useAuth } from "@/context/AuthContext";
import { StreamProvider } from "@/context/StreamContext";
import { VideoProvider } from "@/context/VideoContext";
import { Slot, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StreamProvider>
        <VideoProvider>
          <AuthGate>
            <Slot />
          </AuthGate>
        </VideoProvider>
      </StreamProvider>
    </AuthProvider>
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
      <StreamProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </StreamProvider>
    );
  }

  return <>{children}</>;
}
