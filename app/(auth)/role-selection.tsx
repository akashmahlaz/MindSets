import { Button } from '@/components/ui/button';
import { useColorScheme } from '@/lib/useColorScheme';
import { UserRole } from '@/types/user';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
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
      router.push({
        pathname: '/(auth)/sign-up',
        params: { role: selectedRole }
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar 
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? '#0f172a' : '#ffffff'}
      />
      
      <ScrollView 
        className="flex-1 px-6 py-8" 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View className="items-center mb-12">
          <View className="w-20 h-20 bg-blue-500 rounded-3xl items-center justify-center mb-6">
            <Ionicons name="heart" size={36} color="white" />
          </View>
          <Text className="text-3xl font-bold text-foreground text-center mb-4">
            Welcome to MindConnect
          </Text>
          <Text className="text-muted-foreground text-center text-lg leading-relaxed">
            Your trusted platform for mental health support. Choose how you'd like to join our community.
          </Text>
        </View>        {/* Role Selection Cards */}
        <View className="space-y-8 mb-8">
          {/* User/Client Option */}
          <Pressable
            onPress={() => handleRoleSelect('user')}
            className={`rounded-2xl p-6 border-2 ${
              selectedRole === 'user' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' 
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
          >
            <View className="flex-row items-center space-x-4">
              <View className={`w-16 h-16 rounded-2xl items-center justify-center ${
                selectedRole === 'user' 
                  ? 'bg-blue-500' 
                  : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                <Ionicons 
                  name="person" 
                  size={28} 
                  color={selectedRole === 'user' ? 'white' : '#3B82F6'} 
                />
              </View>
              <View className="flex-1">
                <Text className={`font-bold text-xl mb-2 ${
                  selectedRole === 'user' 
                    ? 'text-blue-700 dark:text-blue-300' 
                    : 'text-foreground'
                }`}>
                  I'm seeking support
                </Text>
                <Text className="text-muted-foreground text-base">
                  Connect with licensed mental health professionals for therapy and counseling
                </Text>
              </View>
              {selectedRole === 'user' && (
                <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
              )}
            </View>
          </Pressable>

          {/* Counsellor/Professional Option */}
          <Pressable
            onPress={() => handleRoleSelect('counsellor')}
            className={`rounded-2xl p-6 border-2 ${
              selectedRole === 'counsellor' 
                ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
          >
            <View className="flex-row items-center space-x-4">
              <View className={`w-16 h-16 rounded-2xl items-center justify-center ${
                selectedRole === 'counsellor' 
                  ? 'bg-green-500' 
                  : 'bg-green-100 dark:bg-green-900/30'
              }`}>
                <Ionicons 
                  name="medical" 
                  size={28} 
                  color={selectedRole === 'counsellor' ? 'white' : '#10B981'} 
                />
              </View>
              <View className="flex-1">
                <Text className={`font-bold text-xl mb-2 ${
                  selectedRole === 'counsellor' 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-foreground'
                }`}>
                  I'm a mental health professional
                </Text>
                <Text className="text-muted-foreground text-base">
                  Join our platform to provide therapy and support to those in need
                </Text>
              </View>
              {selectedRole === 'counsellor' && (
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              )}
            </View>
          </Pressable>
        </View>

        {/* Action Buttons */}
        <View className="space-y-4">
          <Button 
            onPress={handleContinue} 
            disabled={!selectedRole}
            className={`w-full h-14 rounded-xl ${
              selectedRole 
                ? 'bg-blue-500' 
                : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <Text className={`font-bold text-lg ${
              selectedRole 
                ? 'text-white' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              Continue
            </Text>
          </Button>
          
          <View className="flex-row justify-center items-center space-x-2 pt-4">
            <Text className="text-muted-foreground text-base">Already have an account?</Text>
            <Pressable onPress={() => router.replace('/(auth)/sign-in')}>
              <Text className="text-blue-500 font-semibold text-base">Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}