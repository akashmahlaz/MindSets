import { Redirect } from 'expo-router';

export default function HomeScreen() {
  // Redirect to the home tab layout with Material Top Tabs
  return <Redirect href="./home/overview" />;
}
