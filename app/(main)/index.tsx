import { View, Text, Button } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '../../firebaseConfig';
import { useRouter } from 'expo-router';
import "@/app/global.css"

export default function HomeScreen() {
  const router = useRouter();

  const handleSignOut = async () => {
    const auth = getAuth(app);
    await signOut(auth);
    router.replace('/(auth)/sign-in');
  };

  return (
    <View className='flex-1 items-center justify-center bg-white p-4'>
      <Text className='text-2xl text-blue-500 font-bold' >Welcome Home!</Text>
      <Button title="Sign Out" onPress={handleSignOut} />
    </View>
  );
}
