import "@/app/global.css";
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useVideo } from '@/context/VideoContext';
import { useAuth } from '@/context/AuthContext';
import { makeCall, generateCallId } from '@/lib/callHelpers';

export default function CallScreen() {
  const router = useRouter();
  const { videoClient } = useVideo();
  const { user } = useAuth();
  const [userIdToCall, setUserIdToCall] = useState('');

  const handleMakeCall = async (isVideo: boolean) => {
    if (!videoClient || !user) {
      Alert.alert('Error', 'Video client not available or user not authenticated');
      return;
    }

    if (!userIdToCall.trim()) {
      Alert.alert('Error', 'Please enter a user ID to call');
      return;
    }

    if (userIdToCall.trim() === user.uid) {
      Alert.alert('Error', 'You cannot call yourself');
      return;
    }

    try {
      const callId = generateCallId();
      const members = [user.uid, userIdToCall.trim()];
      
      console.log('Initiating call:', { callId, members, isVideo });
      
      const call = await makeCall(videoClient, callId, members, isVideo);
      
      // Navigate to the call screen with the call ID
      router.push(`/call/${callId}`);
    } catch (error) {
      console.error('Error making call:', error);
      Alert.alert('Error', 'Failed to initiate call. Please try again.');
    }
  };

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

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-6 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-800">Calls</Text>
        <Text className="text-gray-600 mt-1">Make and manage your calls</Text>
      </View>      {/* Quick Actions */}
      <View className="px-6 py-4">
        <Text className="text-lg font-semibold text-gray-800 mb-4">Make a Call</Text>
        
        {/* User ID Input */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Enter User ID to call:</Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
            placeholder="e.g., user123"
            value={userIdToCall}
            onChangeText={setUserIdToCall}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        
        <View className="flex-row space-x-3">
          <TouchableOpacity 
            className="bg-green-500 rounded-xl p-4 flex-1 items-center"
            onPress={() => handleMakeCall(false)}
            disabled={!userIdToCall.trim()}
          >
            <IconSymbol name="phone.fill" size={24} color="white" />
            <Text className="text-white font-semibold mt-2">Voice Call</Text>
          </TouchableOpacity>          
          <TouchableOpacity 
            className="bg-blue-500 rounded-xl p-4 flex-1 items-center"
            onPress={() => handleMakeCall(true)}
            disabled={!userIdToCall.trim()}
          >
            <IconSymbol name="video.fill" size={24} color="white" />
            <Text className="text-white font-semibold mt-2">Video Call</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Calls */}
      <View className="px-6">
        <Text className="text-lg font-semibold text-gray-800 mb-4">Recent Calls</Text>
        <View className="bg-white rounded-xl overflow-hidden shadow-sm">
          {recentCalls.map((call, index) => (
            <TouchableOpacity
              key={call.id}
              className={`p-4 flex-row items-center ${
                index !== recentCalls.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <View className="mr-3">
                <IconSymbol
                  name="phone.fill"
                  size={24}
                  color={call.missed ? '#EF4444' : '#10B981'}
                />
              </View>
              
              <View className="flex-1">
                <Text className={`font-semibold ${call.missed ? 'text-red-500' : 'text-gray-800'}`}>
                  {call.name}
                </Text>
                <Text className="text-gray-600 text-sm">
                  {call.missed ? 'Missed call' : `Duration: ${call.duration}`} • {call.time}
                </Text>
              </View>
              
              <TouchableOpacity className="ml-3">
                <IconSymbol name="phone.fill" size={20} color="#3B82F6" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Call Settings */}
      <View className="px-6 py-6">
        <TouchableOpacity className="bg-white rounded-xl p-4 shadow-sm flex-row items-center justify-between">
          <View className="flex-row items-center">
            <IconSymbol name="gearshape.fill" size={20} color="#6B7280" />
            <Text className="text-gray-800 font-medium ml-3">Call Settings</Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
