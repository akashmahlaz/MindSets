import { View, Text, Button } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '../../firebaseConfig';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  const handleSignOut = async () => {
    const auth = getAuth(app);
    await signOut(auth);
    router.replace('/(auth)/sign-in');
  };

  return (
    <View>
      <Text>Welcome Home!</Text>
      <Button title="Sign Out" onPress={handleSignOut} />
    </View>
  );
}
