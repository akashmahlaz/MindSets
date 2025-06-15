import "@/app/global.css";
import { IconSymbol } from '@/components/ui/IconSymbol';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

export default function ActivityScreen() {
  const activities = [
    {
      id: '1',
      type: 'message',
      title: 'New message from John Doe',
      description: 'Hey, how are you doing?',
      time: '2 minutes ago',
      icon: 'message.fill',
      color: 'bg-blue-500',
      read: false,
    },
    {
      id: '2',
      type: 'call',
      title: 'Missed call from Alice Smith',
      description: 'Incoming call at 2:00 PM',
      time: '1 hour ago',
      icon: 'phone.fill',
      color: 'bg-red-500',
      read: false,
    },
    {
      id: '3',
      type: 'group',
      title: 'Added to Team Project group',
      description: 'Sarah added you to the group',
      time: '3 hours ago',
      icon: 'person.3.fill',
      color: 'bg-green-500',
      read: true,
    },
    {
      id: '4',
      type: 'message',
      title: 'File shared in Design Team',
      description: 'Mike shared design-mockups.fig',
      time: '4 hours ago',
      icon: 'doc.fill',
      color: 'bg-purple-500',
      read: true,
    },
    {
      id: '5',
      type: 'call',
      title: 'Video call with John Doe',
      description: 'Call duration: 25:30',
      time: 'Yesterday',
      icon: 'video.fill',
      color: 'bg-blue-500',
      read: true,
    },
    {
      id: '6',
      type: 'system',
      title: 'Profile updated',
      description: 'You updated your profile picture',
      time: 'Yesterday',
      icon: 'person.crop.circle.fill',
      color: 'bg-gray-500',
      read: true,
    },
  ];

  const getActivityTypeText = (type: string) => {
    switch (type) {
      case 'message':
        return 'MESSAGE';
      case 'call':
        return 'CALL';
      case 'group':
        return 'GROUP';
      case 'system':
        return 'SYSTEM';
      default:
        return 'ACTIVITY';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-bold text-gray-800">Activity Feed</Text>
          <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium text-sm">Mark All Read</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-gray-600 text-sm mt-1">
          Stay updated with your latest interactions
        </Text>
      </View>

      {/* Activity Stats */}
      <View className="px-6 py-4">
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <Text className="font-semibold text-gray-800 mb-3">Today's Summary</Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-2xl font-bold text-blue-500">12</Text>
              <Text className="text-xs text-gray-600">Messages</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-500">3</Text>
              <Text className="text-xs text-gray-600">Calls</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-purple-500">2</Text>
              <Text className="text-xs text-gray-600">Groups</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-orange-500">5</Text>
              <Text className="text-xs text-gray-600">Files</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Activity List */}
      <View className="px-6">
        <Text className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</Text>
        <View className="space-y-3">
          {activities.map((activity, index) => (
            <TouchableOpacity
              key={activity.id}
              className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
                activity.read ? 'border-gray-200' : 'border-blue-500'
              }`}
            >
              <View className="flex-row items-start">
                <View className={`${activity.color} rounded-full p-2 mr-3`}>
                  <IconSymbol 
                    name={activity.icon as any} 
                    size={16} 
                    color="white" 
                  />
                </View>
                
                <View className="flex-1">
                  <View className="flex-row justify-between items-start mb-1">
                    <Text className={`font-semibold ${
                      activity.read ? 'text-gray-700' : 'text-gray-900'
                    }`}>
                      {activity.title}
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-xs text-blue-500 font-medium mr-2">
                        {getActivityTypeText(activity.type)}
                      </Text>
                      {!activity.read && (
                        <View className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </View>
                  </View>
                  
                  <Text className="text-gray-600 text-sm mb-2">
                    {activity.description}
                  </Text>
                  
                  <Text className="text-xs text-gray-500">
                    {activity.time}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Load More */}
      <View className="px-6 py-6">
        <TouchableOpacity className="bg-gray-100 rounded-xl p-4 items-center">
          <Text className="text-gray-600 font-medium">Load More Activities</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}
