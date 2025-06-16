import { useState } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity } from 'react-native';
import { getAuth, signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as Apple from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { app } from '../../firebaseConfig';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const auth = getAuth(app);

  // Google
  const [_, __, promptAsync] = Google.useAuthRequest({
    clientId: '84524660788-3unj4cgjivvh4jqj39o8aeae6tu41anm.apps.googleusercontent.com',
  });

  const handleGoogleSignIn = async () => {
    const result = await promptAsync();
    if (result?.type === 'success' && result.authentication?.idToken) {
      const credential = GoogleAuthProvider.credential(result.authentication.idToken);
      await signInWithCredential(auth, credential);
    }
  };

  // Apple
  const handleAppleSignIn = async () => {
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

  const handleEmailSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <View style={{ padding: 20, marginTop: 80 }}>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" style={{ borderWidth: 1, marginBottom: 10, padding: 10 }} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={{ borderWidth: 1, marginBottom: 10, padding: 10 }} />
      <Button title="Sign In" onPress={handleEmailSignIn} />
      
      <Button title="Sign In with Google" onPress={handleGoogleSignIn} />
      <Apple.AppleAuthenticationButton
        buttonType={Apple.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={Apple.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={5}
        style={{ width: 200, height: 44, marginTop: 10 }}
        onPress={handleAppleSignIn}
      />
      {error ? <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text> : null}
      <TouchableOpacity onPress={() => router.replace('/(auth)/sign-up')}>
        <Text style={{ marginTop: 20, color: 'blue', textAlign: 'center' }}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}
