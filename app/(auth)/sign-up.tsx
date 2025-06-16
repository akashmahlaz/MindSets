import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useColorScheme } from '@/lib/useColorScheme';
import * as Apple from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, OAuthProvider, signInWithCredential } from 'firebase/auth';
import { useState } from 'react';
import { Platform, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { app } from '../../firebaseConfig';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const auth = getAuth(app);
  const { isDarkColorScheme } = useColorScheme();

  // Google
  const [_, __, promptAsync] = Google.useAuthRequest({
    clientId: '84524660788-3unj4cgjivvh4jqj39o8aeae6tu41anm.apps.googleusercontent.com',
  });

  const handleGoogleSignUp = async () => {
    const result = await promptAsync();
    if (result?.type === 'success' && result.authentication?.idToken) {
      const credential = GoogleAuthProvider.credential(result.authentication.idToken);
      await signInWithCredential(auth, credential);
    }
  };

  // Apple
  const handleAppleSignUp = async () => {
    const credential = await Apple.signInAsync({
      requestedScopes: [
        Apple.AppleAuthenticationScope.FULL_NAME,
        Apple.AppleAuthenticationScope.EMAIL,
      ],
    });
    const provider = new OAuthProvider('apple.com');
    const firebaseCredential = provider.credential({
      idToken: credential.identityToken!,
      rawNonce: credential.state!,
    });
    await signInWithCredential(auth, firebaseCredential);
  };

  const handleEmailSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar 
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? '#0f172a' : '#ffffff'}
      />
      <View className="flex-1 justify-center px-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Sign up to get started with your new account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <Button onPress={handleEmailSignUp} className="w-full">
              <Text className="text-primary-foreground font-medium">Sign Up</Text>
            </Button>
            
            <View className="relative">
              <View className="absolute inset-0 flex items-center">
                <View className="w-full border-t border-border" />
              </View>
              <View className="relative flex justify-center text-xs uppercase">
                <Text className="bg-background px-2 text-muted-foreground">Or continue with</Text>
              </View>
            </View>
            
            <Button variant="outline" onPress={handleGoogleSignUp} className="w-full">
              <Text className="text-foreground font-medium">Sign Up with Google</Text>
            </Button>
            
            {Platform.OS === 'ios' && (
              <Apple.AppleAuthenticationButton
                buttonType={Apple.AppleAuthenticationButtonType.SIGN_UP}
                buttonStyle={Apple.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={8}
                style={{ width: '100%', height: 44 }}
                onPress={handleAppleSignUp}
              />
            )}
            
            {error ? (
              <Text className="text-destructive text-center text-sm">{error}</Text>
            ) : null}
            
            <Button variant="ghost" onPress={() => router.replace('/(auth)/sign-in')} className="w-full">
              <Text className="text-primary font-medium">Already have an account? Sign In</Text>
            </Button>
          </CardContent>
        </Card>
      </View>
    </SafeAreaView>
  );
}
