import "@/app/global.css";
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function RecentScreen() {
  const router = useRouter();

  const recentChats = [
    {
      id: '1',
      name: 'John Doe',
      message: 'Hey, how are you doing?',
      time: '2:30 PM',
      unread: 2,
      online: true,
      avatar: '👨‍💼',
    },
    {
      id: '2',
      name: 'Team Project',
      message: 'Sarah: The deadline is tomorrow',
      time: '1:45 PM',
      unread: 0,
      online: false,
      avatar: '👥',
      isGroup: true,
    },
    {
      id: '3',
      name: 'Alice Smith',
      message: 'Thanks for the help!',
      time: '12:30 PM',
      unread: 0,
      online: true,
      avatar: '👩‍💻',
    },
    {
      id: '4',
      name: 'Design Team',
      message: 'Mike: New mockups are ready',
      time: '11:15 AM',
      unread: 5,
      online: false,
      avatar: '🎨',
      isGroup: true,
    },
  ];

  const recentCalls = [
    {
      id: '1',
      name: 'John Doe',
      type: 'incoming',
      time: '3:15 PM',
      duration: '12:45',
      missed: false,
    },
    {
      id: '2',
      name: 'Alice Smith',
      type: 'outgoing',
      time: '2:00 PM',
      duration: '5:20',
      missed: false,
    },
    {
      id: '3',
      name: 'Unknown',
      type: 'incoming',
      time: '1:30 PM',
      duration: '0:00',
      missed: true,
    },
  ];

  const renderChatItem = ({ item }: { item: typeof recentChats[0] }) => (
    <TouchableOpacity
      onPress={() => router.push('/chat/')}
      className="bg-white p-4 border-b border-gray-100 flex-row items-center"
    >
      <View className="relative mr-3">
        <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center">
          <Text className="text-xl">{item.avatar}</Text>
        </View>
        {item.online && (
          <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
        )}
      </View>
      
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="font-semibold text-gray-800">{item.name}</Text>
          <Text className="text-xs text-gray-500">{item.time}</Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-gray-600 text-sm flex-1" numberOfLines={1}>
            {item.message}
          </Text>
          {item.unread > 0 && (
            <View className="bg-blue-500 rounded-full px-2 py-1 ml-2">
              <Text className="text-white text-xs font-bold">{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCallItem = ({ item }: { item: typeof recentCalls[0] }) => (
    <TouchableOpacity className="bg-white p-4 border-b border-gray-100 flex-row items-center">
      <View className="mr-3">        <IconSymbol
          name={item.missed ? 'phone.fill' : 'phone.fill'}
          size={24}
          color={item.missed ? '#EF4444' : item.type === 'incoming' ? '#10B981' : '#3B82F6'}
        />
      </View>
      
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text className={`font-semibold ${item.missed ? 'text-red-500' : 'text-gray-800'}`}>
            {item.name}
          </Text>
          <Text className="text-xs text-gray-500">{item.time}</Text>
        </View>
        <Text className="text-gray-600 text-sm">
          {item.missed ? 'Missed call' : `Duration: ${item.duration}`}
        </Text>
      </View>
      
      <TouchableOpacity className="ml-3">
        <IconSymbol name="phone.fill" size={20} color="#3B82F6" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Recent Chats Section */}
      <View className="mt-4">
        <View className="flex-row justify-between items-center px-6 py-3">
          <Text className="text-lg font-semibold text-gray-800">Recent Chats</Text>
          <TouchableOpacity onPress={() => router.push('/chat/')}>
            <Text className="text-blue-500 font-medium">See All</Text>
          </TouchableOpacity>
        </View>
        
        <View className="bg-white">
          <FlatList
            data={recentChats.slice(0, 4)}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      </View>

      {/* Recent Calls Section */}
      <View className="mt-6">
        <View className="flex-row justify-between items-center px-6 py-3">
          <Text className="text-lg font-semibold text-gray-800">Recent Calls</Text>
          <TouchableOpacity>
            <Text className="text-blue-500 font-medium">See All</Text>
          </TouchableOpacity>
        </View>
        
        <View className="bg-white">
          <FlatList
            data={recentCalls}
            renderItem={renderCallItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      </View>

      {/* Quick Call Actions */}
      <View className="px-6 py-4">
        <Text className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</Text>
        <View className="flex-row justify-between">
          <TouchableOpacity className="bg-green-500 rounded-xl p-4 flex-1 mr-2 items-center">
            <IconSymbol name="phone.fill" size={24} color="white" />
            <Text className="text-white font-semibold mt-2">Voice Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="bg-blue-500 rounded-xl p-4 flex-1 ml-2 items-center">
            <IconSymbol name="video.fill" size={24} color="white" />
            <Text className="text-white font-semibold mt-2">Video Call</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
