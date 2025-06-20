import "@/app/global.css";
import ClientList from '@/components/dashboard/ClientList';
import { useColorScheme } from '@/lib/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClientsScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? '#0f172a' : '#ffffff'}
      />

      {/* Header */}
      <View className="px-6 py-4 border-b border-border">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="#6366F1" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">My Clients</Text>
            <Text className="text-muted-foreground">Connect with your clients</Text>
          </View>
        </View>
      </View>

      {/* Client List */}
      <ClientList />
    </SafeAreaView>
  );
}
