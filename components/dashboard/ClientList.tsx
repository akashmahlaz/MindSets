import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { useVideo } from "@/context/VideoContext";
import { getAllUsers } from "@/services/userService";
import { UserProfile } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ClientList() {
  const router = useRouter();
  const { user } = useAuth();
  const { chatClient, isChatConnected, connectToChat } = useChat();
  const { createCall, isVideoConnected } = useVideo();

  const [clients, setClients] = useState<UserProfile[]>([]);
  const [filteredClients, setFilteredClients] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      if (!user?.uid) return;

      // Get all users and filter to show only regular users (clients)
      const allUsers = await getAllUsers(user.uid);
      const clientUsers = allUsers.filter(
        (u) => u.uid !== user?.uid && u.role === "user", // Only show regular users as potential clients
      );

      setClients(clientUsers);
      setFilteredClients(clientUsers);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClients();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(
        (client) =>
          client.displayName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          client.email.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  const handleClientPress = (selectedClient: UserProfile) => {
    router.push({
      pathname: "/profile/[userId]",
      params: { userId: selectedClient.uid },
    });
  };

  const generateCallId = (userId1: string, userId2: string) => {
    const user1Short = userId1.substring(0, 8);
    const user2Short = userId2.substring(0, 8);
    const timestamp = Date.now().toString(36);
    const callId = `${user1Short}-${user2Short}-${timestamp}`;

    if (callId.length > 64) {
      const shortTimestamp = timestamp.substring(0, 6);
      return `${user1Short.substring(0, 6)}-${user2Short.substring(0, 6)}-${shortTimestamp}`;
    }

    return callId;
  };

  const startCall = async (targetClient: UserProfile, isVideo = true) => {
    if (!isVideoConnected || !user?.uid) {
      Alert.alert("Error", "Video service not available. Please try again.");
      return;
    }

    try {
      const callId = generateCallId(user.uid, targetClient.uid);
      const call = await createCall(callId, [targetClient.uid], isVideo);

      if (!call) {
        throw new Error("Failed to create call");
      }
    } catch (error) {
      console.error("Error starting call:", error);
      Alert.alert(
        "Error",
        "Failed to start call. Please check your connection and try again.",
      );
    }
  };

  const startChat = async (targetClient: UserProfile) => {
    if (!user || !chatClient) {
      Alert.alert("Error", "Chat not available");
      return;
    }

    if (!isChatConnected) {
      try {
        await connectToChat();
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        Alert.alert("Error", "Failed to connect to chat");
        return;
      }
    }

    try {
      const { createOrGetDirectChannel } = await import(
        "@/services/chatHelpers"
      );
      const channel = await createOrGetDirectChannel(user, targetClient.uid);
      router.push(`/(main)/chat/${channel.id}` as any);
    } catch (error) {
      Alert.alert(
        "Chat Error",
        `Failed to start chat with ${targetClient.displayName}. Please try again.`,
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderClientItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      onPress={() => handleClientPress(item)}
      className="active:opacity-70"
    >
      <Card className="mx-4 mb-3 bg-card border border-border">
        <CardContent className="p-4">
          <View className="flex-row items-center space-x-3">
            <View className="relative">
              <Avatar className="w-12 h-12" alt={`${item.displayName} avatar`}>
                <AvatarImage source={{ uri: item.photoURL || undefined }} />
                <AvatarFallback className="bg-primary">
                  <Text className="text-primary-foreground font-medium">
                    {getInitials(item.displayName)}
                  </Text>
                </AvatarFallback>
              </Avatar>
              <View
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${getStatusColor(item.status)}`}
              />
            </View>
            <View className="flex-1">
              <Text className="text-card-foreground font-semibold text-base">
                {item.displayName}
              </Text>
              <Text className="text-muted-foreground text-sm" numberOfLines={1}>
                {item.email}
              </Text>
              <Text className="text-muted-foreground text-xs mt-1 capitalize">
                {item.status}
              </Text>
            </View>
            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() => startChat(item)}
                accessibilityRole="button"
                accessibilityLabel={`Chat with ${item.displayName}`}
                className="p-2 rounded-full bg-primary/10 min-w-[40px] min-h-[40px] items-center justify-center"
              >
                <Ionicons name="chatbubble" size={16} className="text-primary" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => startCall(item, false)}
                accessibilityRole="button"
                accessibilityLabel={`Call ${item.displayName}`}
                className="p-2 rounded-full bg-success/10 min-w-[40px] min-h-[40px] items-center justify-center"
              >
                <Ionicons name="call" size={16} className="text-success" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => startCall(item, true)}
                accessibilityRole="button"
                accessibilityLabel={`Video call ${item.displayName}`}
                className="p-2 rounded-full bg-primary/10 min-w-[40px] min-h-[40px] items-center justify-center"
              >
                <Ionicons name="videocam" size={16} className="text-primary" />
              </TouchableOpacity>
            </View>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  const renderClientSkeleton = () => (
    <Card className="mx-4 mb-3 bg-card border border-border">
      <CardContent className="p-4">
        <View className="flex-row items-center space-x-3">
          <View className="relative">
            <Skeleton className="w-12 h-12 rounded-full" />
            <Skeleton className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full" />
          </View>
          <View className="flex-1">
            <Skeleton className="w-32 h-5 rounded mb-1" />
            <Skeleton className="w-40 h-4 rounded mb-1" />
            <Skeleton className="w-16 h-3 rounded" />
          </View>
          <View className="flex-row space-x-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </View>
        </View>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <View className="px-4 pt-2 pb-2">
          <Skeleton className="w-full h-12 rounded" />
        </View>
        <View className="flex-1">
          {[...Array(6)].map((_, index) => (
            <View key={index}>{renderClientSkeleton()}</View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Search */}
      <View className="px-4 pt-2 pb-2">
        <Input
          placeholder="Search clients..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="mb-4 dark:bg-slate-800 dark:text-slate-400"
        />
      </View>

      <FlatList
        data={filteredClients}
        renderItem={renderClientItem}
        keyExtractor={(item) => item.uid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-20">
            <Ionicons
              name="people-outline"
              size={64}
              color="#9CA3AF"
              style={{ marginBottom: 16 }}
            />
            <Text className="text-muted-foreground text-lg font-medium">
              {searchQuery ? "No clients found" : "No clients available"}
            </Text>
            <Text className="text-muted-foreground text-sm mt-2 text-center px-8">
              {searchQuery
                ? "Try searching with a different name or email"
                : "Clients will appear here when they connect with you"}
            </Text>
            {!searchQuery && (
              <Button onPress={onRefresh} className="mt-4" variant="outline">
                <Text>Refresh</Text>
              </Button>
            )}
          </View>
        }
      />
    </View>
  );
}
