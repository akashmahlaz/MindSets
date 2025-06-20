import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useColorScheme } from '@/lib/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import * as Apple from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import { getAuth, GoogleAuthProvider, OAuthProvider, signInWithCredential, signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { app } from '../../firebaseConfig';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'email' | 'google' | 'apple' | null>(null);
  const router = useRouter();
  const auth = getAuth(app);
  const { isDarkColorScheme } = useColorScheme();

  // Google
  const [_, __, promptAsync] = Google.useAuthRequest({
    clientId: '84524660788-3unj4cgjivvh4jqj39o8aeae6tu41anm.apps.googleusercontent.com',
  });
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setLoadingType('google');
      setError('');
      
      const result = await promptAsync();
      if (result?.type === 'success' && result.authentication?.idToken) {
        const credential = GoogleAuthProvider.credential(result.authentication.idToken);
        await signInWithCredential(auth, credential);
      } else if (result?.type === 'cancel') {
        // User cancelled, don't show error
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };
  // Apple
  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);
      setLoadingType('apple');
      setError('');
      
      const credential = await Apple.signInAsync({
        requestedScopes: [
          Apple.AppleAuthenticationScope.FULL_NAME,
          Apple.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      if (credential.identityToken) {
        const provider = new OAuthProvider('apple.com');
        const firebaseCredential = provider.credential({
          idToken: credential.identityToken,
          rawNonce: credential.state!,
        });
        await signInWithCredential(auth, firebaseCredential);
      }
    } catch (error: any) {
      console.error('Apple sign-in error:', error);
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        setError('Failed to sign in with Apple. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };
  const handleEmailSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingType('email');
      setError('');
      
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: any) {
      console.error('Email sign-in error:', error);
      
      // Provide user-friendly error messages
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection');
          break;
        default:
          setError('Failed to sign in. Please try again');
      }
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar 
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? '#0f172a' : '#ffffff'}
      />
      
      {/* Hero Section */}
      <View className="px-6 pt-8 pb-6">
        <View className="items-center mb-8">
          {/* Logo/Icon */}
          <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-6">
            <Ionicons 
              name="heart" 
              size={40} 
              color={isDarkColorScheme ? "#3b82f6" : "#1d4ed8"} 
            />
          </View>
          
          {/* Welcome Text */}
          <Text className="text-3xl font-bold text-foreground mb-3 text-center">
            Welcome Back
          </Text>
          <Text className="text-lg text-muted-foreground text-center leading-6">
            Sign in to continue your mental health journey with{'\n'}
            <Text className="text-primary font-semibold">MindConnect</Text>
          </Text>
        </View>
      </View>

      {/* Form Section */}
      <View className="flex-1 px-6">
        <Card className="w-full shadow-lg border-0 bg-card/95 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl text-center text-foreground">Sign In</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Email Input */}
            <View className="space-y-2">
              <Text className="text-sm font-medium text-foreground">Email</Text>
              <View className="relative">
                <Input
                  placeholder="Enter your email address"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError(''); // Clear error when user types
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                  className="h-12 pl-12"
                />
                <View className="absolute left-3 top-3">
                  <Ionicons name="mail-outline" size={20} color={isDarkColorScheme ? "#9ca3af" : "#6b7280"} />
                </View>
              </View>
            </View>

            {/* Password Input */}
            <View className="space-y-2">
              <Text className="text-sm font-medium text-foreground">Password</Text>
              <View className="relative">
                <Input
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError(''); // Clear error when user types
                  }}
                  secureTextEntry
                  editable={!isLoading}
                  className="h-12 pl-12"
                />
                <View className="absolute left-3 top-3">
                  <Ionicons name="lock-closed-outline" size={20} color={isDarkColorScheme ? "#9ca3af" : "#6b7280"} />
                </View>
              </View>
            </View>
            
            {/* Forgot Password */}
            <TouchableOpacity 
              onPress={() => {
                // TODO: Implement forgot password
                Alert.alert('Coming Soon', 'Forgot password functionality will be available soon.');
              }}
              disabled={isLoading}
              className="self-end"
            >
              <Text className="text-primary text-sm font-medium">Forgot Password?</Text>
            </TouchableOpacity>
            
            {/* Sign In Button */}
            <Button 
              onPress={handleEmailSignIn} 
              disabled={isLoading || !email.trim() || !password.trim()}
              className="w-full h-12 shadow-sm"
            >
              {isLoading && loadingType === 'email' ? (
                <View className="flex-row items-center">
                  <ActivityIndicator 
                    size="small" 
                    color="#ffffff" 
                    style={{ marginRight: 8 }} 
                  />
                  <Text className="text-primary-foreground font-medium">Signing In...</Text>
                </View>
              ) : (
                <Text className="text-primary-foreground font-medium text-base">Sign In</Text>
              )}
            </Button>
            
            {/* Divider */}
            <View className="relative my-6">
              <View className="absolute inset-0 flex items-center">
                <View className="w-full border-t border-border" />
              </View>
              <View className="relative flex justify-center text-xs uppercase">
                <Text className="bg-card px-4 text-muted-foreground font-medium">
                  Or continue with
                </Text>
              </View>
            </View>
            
            {/* Social Sign In Buttons */}
            <View className="space-y-3">
              {/* Google Sign In */}
              <Button 
                variant="outline" 
                onPress={handleGoogleSignIn} 
                disabled={isLoading}
                className="w-full h-12 border-border"
              >
                {isLoading && loadingType === 'google' ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator 
                      size="small" 
                      color={isDarkColorScheme ? "#ffffff" : "#000000"} 
                      style={{ marginRight: 8 }} 
                    />
                    <Text className="text-foreground font-medium">Connecting...</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons name="logo-google" size={20} color="#EA4335" style={{ marginRight: 8 }} />
                    <Text className="text-foreground font-medium text-base">Continue with Google</Text>
                  </View>
                )}
              </Button>
              
              {/* Apple Sign In */}
              {Platform.OS === 'ios' && (
                <View>
                  {isLoading && loadingType === 'apple' ? (
                    <Button variant="outline" disabled className="w-full h-12">
                      <View className="flex-row items-center">
                        <ActivityIndicator 
                          size="small" 
                          color={isDarkColorScheme ? "#ffffff" : "#000000"} 
                          style={{ marginRight: 8 }} 
                        />
                        <Text className="text-foreground font-medium">Connecting...</Text>
                      </View>
                    </Button>
                  ) : (
                    <Apple.AppleAuthenticationButton
                      buttonType={Apple.AppleAuthenticationButtonType.SIGN_IN}
                      buttonStyle={isDarkColorScheme ? Apple.AppleAuthenticationButtonStyle.WHITE : Apple.AppleAuthenticationButtonStyle.BLACK}
                      cornerRadius={8}
                      style={{ width: '100%', height: 48 }}
                      onPress={handleAppleSignIn}
                    />
                  )}
                </View>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error ? (
          <View className="mt-4 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <View className="flex-row items-center">
              <Ionicons name="alert-circle" size={20} color="#ef4444" style={{ marginRight: 8 }} />
              <Text className="text-destructive text-sm font-medium flex-1">{error}</Text>
            </View>
          </View>
        ) : null}

        {/* Sign Up Link */}
        <View className="mt-6 mb-4">
          <TouchableOpacity 
            onPress={() => router.replace('/(auth)/role-selection')} 
            disabled={isLoading}
            className="py-4"
          >
            <Text className="text-center text-muted-foreground">
              Don't have an account?{' '}
              <Text className="text-primary font-semibold">Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Footer */}
      <View className="px-6 pb-6">
        <Text className="text-center text-xs text-muted-foreground leading-4">
          By signing in, you agree to our{' '}
          <Text className="text-primary">Terms of Service</Text> and{' '}
          <Text className="text-primary">Privacy Policy</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}
