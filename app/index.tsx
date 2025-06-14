import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the main tab screen or home screen
  return <Redirect href="/(main)" />;
}
