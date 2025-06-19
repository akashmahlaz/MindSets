import React, { useState } from 'react';
import { View, Text, Image, Alert, StatusBar } from 'react-native';
import { Button } from '@/components/ui/button';
import { useCallStateHooks, useCall } from '@stream-io/video-react-native-sdk';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export const CustomOutgoingCall = () => {
  const call = useCall();
  const { useCallMembers } = useCallStateHooks();
  const members = useCallMembers();
  const [isWaiting, setIsWaiting] = useState(true);
  
  // Find the person being called (not the current user)
  const recipient = members.find(member => member.user.id !== call?.currentUserId);
  const recipientName = recipient?.user.name || recipient?.user.id || 'Unknown';
  const recipientImage = recipient?.user.image;
  
  const handleCancel = async () => {
    if (!call) return;
    
    try {
      console.log('Canceling outgoing call:', call.cid);
      await call.leave({ reject: true, reason: 'cancel' });
    } catch (error) {
      console.error('Error canceling call:', error);
    }
  };

  // Listen for when someone accepts the call
  React.useEffect(() => {
    if (!call) return;

    const handleCallAccepted = () => {
      console.log('Call was accepted, joining and navigating...');
      setIsWaiting(false);
      
      // Join the call
      call.join().then(() => {
        // Navigate to call screen
        router.push({
          pathname: '/call/[callId]',
          params: {
            callId: call.id,
            callType: call.type,
            isVideo: 'true',
          },
        });
      }).catch((error) => {
        console.error('Error joining call after acceptance:', error);
        Alert.alert('Error', 'Failed to join call');
      });
    };

    // Listen for call state changes
    const unsubscribe = call.on('call.session_started', handleCallAccepted);
    
    return () => {
      unsubscribe();
    };
  }, [call]);

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View className="flex-1 justify-center items-center px-8">
        {/* Recipient info */}
        <View className="items-center mb-16">
          <View className="w-40 h-40 rounded-full bg-gray-600 mb-6 overflow-hidden">
            {recipientImage ? (
              <Image 
                source={{ uri: recipientImage }} 
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-gray-600 justify-center items-center">
                <Text className="text-white text-5xl font-bold">
                  {recipientName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          
          <Text className="text-white text-4xl font-bold mb-3">{recipientName}</Text>
          <Text className="text-white/70 text-xl">
            {isWaiting ? 'Calling...' : 'Connecting...'}
          </Text>
        </View>

        {/* Animated ringing indicator */}
        {isWaiting && (
          <View className="mb-16">
            <View className="w-6 h-6 bg-white rounded-full animate-pulse" />
          </View>
        )}

        {/* Cancel button - positioned to avoid system UI */}
        <View className="mb-8">
          <Button
            onPress={handleCancel}
            className="w-20 h-20 rounded-full bg-red-500 justify-center items-center shadow-lg"
          >
            <Text className="text-white text-3xl">✕</Text>
          </Button>
        </View>

        {/* Status text */}
        <Text className="text-white/50 text-center text-lg">
          {isWaiting ? 'Waiting for answer...' : 'Call accepted'}
        </Text>
      </View>
    </SafeAreaView>
  );
};
