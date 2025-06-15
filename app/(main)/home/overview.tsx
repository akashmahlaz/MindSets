import "@/app/global.css";
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { app } from '../../../firebaseConfig';

export default function OverviewScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const handleSignOut = async () => {
    const auth = getAuth(app);
    await signOut(auth);
    router.replace('/(auth)/sign-in');
  };
  const quickActions = [
    {
      title: 'Start Chat',
      description: 'Begin a new conversation',
      icon: 'message.fill',
      action: () => router.push('/chat/'),
      color: 'bg-blue-500',
    },
    {
      title: 'Video Call',
      description: 'Start or join a call',
      icon: 'video.fill',
      action: () => console.log('Video call feature'),
      color: 'bg-green-500',
    },
    {
      title: 'View Profile',
      description: 'Manage your account',
      icon: 'person.fill',
      action: () => router.push('/(main)/profile'),
      color: 'bg-purple-500',
    },
    {
      title: 'Settings',
      description: 'App preferences',
      icon: 'gear.fill',
      action: () => console.log('Settings'),
      color: 'bg-gray-500',
    },
  ];

  const stats = [
    { label: 'Messages', value: '1,234', icon: 'message' },
    { label: 'Calls', value: '56', icon: 'phone' },
    { label: 'Contacts', value: '89', icon: 'person.2' },
    { label: 'Groups', value: '12', icon: 'person.3' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-8 shadow-sm">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-gray-800">
              Welcome back! 👋
            </Text>
            <Text className="text-gray-600 mt-1">
              {user?.email || 'User'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-red-500 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View className="px-6 py-4">
        <Text className="text-lg font-semibold text-gray-800 mb-4">
          Your Stats
        </Text>
        <View className="flex-row flex-wrap justify-between">
          {stats.map((stat, index) => (
            <View
              key={index}
              className="bg-white rounded-xl p-4 mb-4 shadow-sm"
              style={{ width: '48%' }}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-2xl font-bold text-gray-800">
                    {stat.value}
                  </Text>
                  <Text className="text-gray-600 text-sm">{stat.label}</Text>
                </View>
                <IconSymbol 
                  name={stat.icon as any} 
                  size={24} 
                  color="#6B7280" 
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-6 py-4">
        <Text className="text-lg font-semibold text-gray-800 mb-4">
          Quick Actions
        </Text>
        <View className="space-y-3">
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              onPress={action.action}
              className="bg-white rounded-xl p-4 shadow-sm flex-row items-center"
            >
              <View className={`${action.color} rounded-full p-3 mr-4`}>
                <IconSymbol 
                  name={action.icon as any} 
                  size={20} 
                  color="white" 
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold text-base">
                  {action.title}
                </Text>
                <Text className="text-gray-600 text-sm">
                  {action.description}
                </Text>
              </View>
              <IconSymbol 
                name="chevron.right" 
                size={16} 
                color="#9CA3AF" 
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity Preview */}
      <View className="px-6 py-4">
        <Text className="text-lg font-semibold text-gray-800 mb-4">
          Recent Activity
        </Text>
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <View className="flex-row items-center mb-3">
            <View className="bg-blue-100 rounded-full p-2 mr-3">
              <IconSymbol name="message.fill" size={16} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-medium">New message</Text>
              <Text className="text-gray-600 text-sm">2 minutes ago</Text>
            </View>
          </View>
          
          <View className="flex-row items-center mb-3">
            <View className="bg-green-100 rounded-full p-2 mr-3">
              <IconSymbol name="phone.fill" size={16} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-medium">Missed call</Text>
              <Text className="text-gray-600 text-sm">1 hour ago</Text>
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => router.push('./activity')}
            className="mt-2 py-2"
          >
            <Text className="text-blue-500 font-medium text-center">
              View All Activity
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
