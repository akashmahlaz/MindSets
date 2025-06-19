import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useColorScheme } from '@/lib/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function SignUpScreen() {
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const [selectedRole, setSelectedRole] = useState<'user' | 'counsellor' | null>(null);

  const handleRoleSelection = (role: 'user' | 'counsellor') => {
    setSelectedRole(role);
    if (role === 'user') {
      router.push('/(auth)/sign-up-user');
    } else {
      router.push('/(auth)/sign-up-counsellor');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar 
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? '#0f172a' : '#ffffff'}
      />
      
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ 
          flexGrow: 1,
          paddingBottom: 20,
          minHeight: height * 0.9 
        }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >        {/* Header with Logo */}
        <View className="items-center px-6 pt-8 pb-6">
          <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-4">
            <Ionicons name="heart" size={36} color="white" />
          </View>
          <Text className="text-3xl font-bold text-foreground text-center mb-3">
            Welcome to MindConnect
          </Text>
          <Text className="text-muted-foreground text-center text-base leading-6 px-2 max-w-sm">
            Your safe space for mental health support. Please select how you'd like to join our community.
          </Text>
        </View>

        {/* Main Content */}
        <View className="flex-1 px-6 justify-between">
          <View className="space-y-5">
            {/* User Role Card */}
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-6">
                <View className="flex-row items-start mb-5">
                  <View className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center mr-4 flex-shrink-0">
                    <Ionicons name="person" size={28} color="#3B82F6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xl font-semibold text-foreground leading-7 mb-3">
                      I'm seeking support
                    </Text>
                    <Text className="text-muted-foreground text-sm leading-6">
                      Connect with licensed mental health professionals for therapy, counseling, and support
                    </Text>
                  </View>
                </View>
                <Button 
                  onPress={() => handleRoleSelection('user')}
                  className="w-full h-12"
                >
                  <Text className="text-primary-foreground font-semibold text-base">Continue as User</Text>
                </Button>
              </CardContent>
            </Card>

            {/* Counsellor Role Card */}
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-6">
                <View className="flex-row items-start mb-5">
                  <View className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full items-center justify-center mr-4 flex-shrink-0">
                    <Ionicons name="medical" size={28} color="#10B981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xl font-semibold text-foreground leading-7 mb-3">
                      I'm a mental health professional
                    </Text>
                    <Text className="text-muted-foreground text-sm leading-6">
                      Join our platform to provide professional mental health services and support
                    </Text>
                  </View>
                </View>
                <Button 
                  onPress={() => handleRoleSelection('counsellor')}
                  variant="outline"
                  className="w-full h-12"
                >
                  <Text className="text-foreground font-semibold text-base">Continue as Professional</Text>
                </Button>
              </CardContent>
            </Card>
          </View>          {/* Features & Sign In Link */}
          <View className="space-y-6">
            {/* Features */}
            <View className="space-y-4">
              <View className="flex-row items-center">
                <Ionicons name="shield-checkmark" size={22} color="#10B981" />
                <Text className="text-foreground ml-3 text-sm leading-6 flex-1">
                  Secure and confidential
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="videocam" size={22} color="#3B82F6" />
                <Text className="text-foreground ml-3 text-sm leading-6 flex-1">
                  Video, audio, and text sessions
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="time" size={22} color="#F59E0B" />
                <Text className="text-foreground ml-3 text-sm leading-6 flex-1">
                  24/7 crisis support available
                </Text>
              </View>
            </View>

            {/* Sign In Link */}
            <View className="items-center py-4 border-t border-border/50">
              <Text className="text-muted-foreground text-sm mb-2">
                Already have an account?
              </Text>
              <Button 
                variant="ghost" 
                onPress={() => router.push('/(auth)/sign-in')}
                className="h-10"
              >
                <Text className="text-primary font-semibold text-base">Sign In</Text>
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
