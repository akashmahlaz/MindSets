import "@/app/global.css";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/lib/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SessionsScreen() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar 
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? '#0f172a' : '#ffffff'}
      />
      
      {/* Header */}
      <View className="px-6 py-4 border-b border-border">
        <Text className="text-2xl font-bold text-foreground">My Sessions</Text>
        <Text className="text-muted-foreground">Manage your appointments and history</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {/* Upcoming Sessions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="items-center py-8">
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text className="text-muted-foreground mt-2 text-center">
                No upcoming sessions scheduled
              </Text>              <Button 
                onPress={() => router.push('/')}
                className="mt-4"
              >
                <Text className="text-primary-foreground">Book a Session</Text>
              </Button>
            </View>
          </CardContent>
        </Card>

        {/* Session History */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Session History</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="items-center py-8">
              <Ionicons name="time-outline" size={48} color="#9CA3AF" />
              <Text className="text-muted-foreground mt-2 text-center">
                No session history yet
              </Text>
              <Text className="text-sm text-muted-foreground text-center mt-1">
                Your completed sessions will appear here
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">            <Button 
              variant="outline" 
              onPress={() => router.push('/')}
              className="w-full justify-start"
            >
              <Text className="text-foreground">📅 Schedule New Session</Text>
            </Button>
            <Button 
              variant="outline" 
              onPress={() => router.push('/chat')}
              className="w-full justify-start"
            >
              <Text className="text-foreground">💬 Message a Counselor</Text>
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
            >
              <Text className="text-foreground">🔔 Session Reminders</Text>
            </Button>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
