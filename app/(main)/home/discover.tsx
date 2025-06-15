import "@/app/global.css";
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const discoverSections = [
    {
      title: 'Trending Groups',
      items: [
        {
          id: '1',
          name: 'React Native Developers',
          description: 'Share tips and tricks for React Native development',
          members: 1234,
          category: 'Tech',
          icon: '💻',
          trending: true,
        },
        {
          id: '2',
          name: 'Design Inspiration',
          description: 'Beautiful UI/UX designs and inspiration',
          members: 856,
          category: 'Design',
          icon: '🎨',
          trending: true,
        },
        {
          id: '3',
          name: 'Startup Discussions',
          description: 'Connect with entrepreneurs and startup enthusiasts',
          members: 567,
          category: 'Business',
          icon: '🚀',
          trending: true,
        },
      ],
    },
    {
      title: 'Popular Channels',
      items: [
        {
          id: '4',
          name: 'Tech News',
          description: 'Latest technology news and updates',
          members: 2341,
          category: 'News',
          icon: '📰',
          trending: false,
        },
        {
          id: '5',
          name: 'Remote Work Tips',
          description: 'Best practices for working from home',
          members: 789,
          category: 'Productivity',
          icon: '🏠',
          trending: false,
        },
      ],
    },
    {
      title: 'Nearby Users',
      items: [
        {
          id: '6',
          name: 'Sarah Johnson',
          description: 'UI/UX Designer at TechCorp',
          members: 0,
          category: 'User',
          icon: '👩‍💻',
          trending: false,
          distance: '2.5 km',
        },
        {
          id: '7',
          name: 'Mike Chen',
          description: 'Full Stack Developer',
          members: 0,
          category: 'User',
          icon: '👨‍💻',
          trending: false,
          distance: '5.1 km',
        },
      ],
    },
  ];

  const categories = [
    { name: 'All', icon: '🌟', active: true },
    { name: 'Tech', icon: '💻', active: false },
    { name: 'Design', icon: '🎨', active: false },
    { name: 'Business', icon: '💼', active: false },
    { name: 'Social', icon: '👥', active: false },
  ];

  const renderDiscoverItem = (item: any, section: string) => (
    <TouchableOpacity
      key={item.id}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
      onPress={() => {
        if (item.category === 'User') {
          // Navigate to user profile or start chat
          console.log('View user profile:', item.name);
        } else {
          // Navigate to group/channel
          console.log('Join group/channel:', item.name);
        }
      }}
    >
      <View className="flex-row items-start">
        <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-3">
          <Text className="text-xl">{item.icon}</Text>
        </View>
        
        <View className="flex-1">
          <View className="flex-row justify-between items-start mb-1">
            <Text className="font-semibold text-gray-800">{item.name}</Text>
            <View className="flex-row items-center">
              {item.trending && (
                <View className="bg-orange-100 px-2 py-1 rounded-full mr-2">
                  <Text className="text-orange-600 text-xs font-medium">Trending</Text>
                </View>
              )}
              <Text className="text-xs text-blue-500 font-medium">{item.category}</Text>
            </View>
          </View>
          
          <Text className="text-gray-600 text-sm mb-2" numberOfLines={2}>
            {item.description}
          </Text>
          
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              {item.category !== 'User' ? (
                <>
                  <IconSymbol name="person.2.fill" size={14} color="#6B7280" />
                  <Text className="text-gray-500 text-xs ml-1">
                    {item.members.toLocaleString()} members
                  </Text>
                </>
              ) : (
                <>
                  <IconSymbol name="location.fill" size={14} color="#6B7280" />
                  <Text className="text-gray-500 text-xs ml-1">{item.distance}</Text>
                </>
              )}
            </View>
            
            <TouchableOpacity className="bg-blue-500 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-medium">
                {item.category === 'User' ? 'Connect' : 'Join'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Search Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-800 mb-3">Discover</Text>
        
        <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-3">
          <IconSymbol name="magnifyingglass" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-3 text-gray-800"
            placeholder="Search groups, channels, or people..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Categories */}
      <View className="px-6 py-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-3">
            {categories.map((category, index) => (
              <TouchableOpacity
                key={index}
                className={`flex-row items-center px-4 py-2 rounded-full ${
                  category.active ? 'bg-blue-500' : 'bg-white border border-gray-200'
                }`}
              >
                <Text className="mr-2">{category.icon}</Text>
                <Text className={`font-medium ${
                  category.active ? 'text-white' : 'text-gray-700'
                }`}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Discover Sections */}
      <View className="px-6">
        {discoverSections.map((section, sectionIndex) => (
          <View key={sectionIndex} className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-800">
                {section.title}
              </Text>
              <TouchableOpacity>
                <Text className="text-blue-500 font-medium">See All</Text>
              </TouchableOpacity>
            </View>
            
            {section.items.map((item) => renderDiscoverItem(item, section.title))}
          </View>
        ))}
      </View>

      {/* Create New Group */}
      <View className="px-6 pb-6">
        <TouchableOpacity 
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 items-center"
          onPress={() => router.push('/chat/')}
        >
          <IconSymbol name="plus.circle.fill" size={24} color="white" />
          <Text className="text-white font-semibold mt-2">Create New Group</Text>
          <Text className="text-blue-100 text-sm">Start your own community</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
