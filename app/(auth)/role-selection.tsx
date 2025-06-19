import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useColorScheme } from '@/lib/useColorScheme';
import { UserRole } from '@/types/user';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StatusBar, Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };
  const handleContinue = () => {
    if (selectedRole) {
      // Pass role as query parameter to sign-up screen
      router.push({
        pathname: '/(auth)/sign-up',
        params: { role: selectedRole }
      });
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
          <CardHeader className="text-center">
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
                <Text className="text-primary text-2xl">🤝</Text>
              </View>
            </View>
            <CardTitle className="text-2xl text-center">Welcome to MindConnect</CardTitle>
            <CardDescription className="text-center text-base">
              Your safe space for mental health support. Please select how you'd like to join our community.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User Option */}
            <View 
              className={`border-2 rounded-lg p-4 ${
                selectedRole === 'user' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border'
              }`}
            >
              <Button
                variant="ghost"
                onPress={() => handleRoleSelect('user')}
                className="w-full justify-start p-0 h-auto"
              >
                <View className="flex-row items-start space-x-4 w-full">
                  <View className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg items-center justify-center">
                    <Text className="text-blue-600 dark:text-blue-400 text-xl">🙋‍♀️</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold text-lg text-left">I'm seeking support</Text>
                    <Text className="text-muted-foreground text-sm text-left mt-1">
                      Connect with licensed mental health professionals for therapy, counseling, and support
                    </Text>
                  </View>
                </View>
              </Button>
            </View>

            {/* Counsellor Option */}
            <View 
              className={`border-2 rounded-lg p-4 ${
                selectedRole === 'counsellor' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border'
              }`}
            >
              <Button
                variant="ghost"
                onPress={() => handleRoleSelect('counsellor')}
                className="w-full justify-start p-0 h-auto"
              >
                <View className="flex-row items-start space-x-4 w-full">
                  <View className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg items-center justify-center">
                    <Text className="text-green-600 dark:text-green-400 text-xl">👨‍⚕️</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold text-lg text-left">I'm a mental health professional</Text>
                    <Text className="text-muted-foreground text-sm text-left mt-1">
                      Join our platform to provide therapy and support to those in need
                    </Text>
                  </View>
                </View>
              </Button>
            </View>

            <Button 
              onPress={handleContinue} 
              disabled={!selectedRole}
              className="w-full mt-6"
            >
              <Text className="text-primary-foreground font-medium">
                Continue
              </Text>
            </Button>
            
            <View className="flex-row justify-center items-center space-x-2 mt-4">
              <Text className="text-muted-foreground text-sm">Already have an account?</Text>
              <Button variant="ghost" onPress={() => router.replace('/(auth)/sign-in')} className="p-0">
                <Text className="text-primary font-medium text-sm">Sign In</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      </View>
    </SafeAreaView>
  );
}
