import "@/app/global.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { useVideo } from "@/context/VideoContext";
import { getUserProfile } from "@/services/userService";
import { CounsellorProfileData } from "@/types/user";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CounsellorProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const { chatClient, isChatConnected, connectToChat } = useChat();
  const { createCall } = useVideo();
  const router = useRouter();
  const [counsellor, setCounsellor] = useState<CounsellorProfileData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCounsellorProfile();
  }, [userId]);

  const loadCounsellorProfile = async () => {
    if (!userId) return;

    try {
      const profile = await getUserProfile(userId);
      if (profile && profile.role === "counsellor") {
        setCounsellor(profile as CounsellorProfileData);
      }
    } catch (error) {
      console.error("Error loading counsellor profile:", error);
      Alert.alert("Error", "Failed to load counsellor profile");
    } finally {
      setLoading(false);
    }
  };

  // Start chat function - same as in index.tsx
  const startChat = async (targetUserId: string) => {
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
      const channel = await createOrGetDirectChannel(user, targetUserId);
      router.push(`/chat/${channel.id}` as any);
    } catch (error) {
      Alert.alert(
        "Chat Error",
        `Failed to start chat with ${counsellor?.displayName || "counsellor"}. Please try again.`,
      );
    }
  };

  const handleStartChat = async () => {
    if (!counsellor) return;
    await startChat(counsellor.uid);
  };

  const handleVideoCall = async () => {
    if (!counsellor || !user) return;

    try {
      const callId = await createCall(
        `call_${user.uid}_${counsellor.uid}_${Date.now()}`,
        [user.uid, counsellor.uid],
      );
      router.push({
        pathname: "/call/[callId]",
        params: { callId },
      });
    } catch (error) {
      Alert.alert("Error", "Failed to start video call");
    }
  };

  const handleBookSession = () => {
    Alert.alert(
      "Coming Soon",
      "Session booking feature will be available soon!",
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center">
          <Text className="text-muted-foreground">Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!counsellor) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-foreground text-center">
            Counsellor profile not found
          </Text>
          <Button onPress={() => router.back()} className="mt-4">
            <Text className="text-primary-foreground">Go Back</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-6 py-4">
        {/* Header */}
        <View className="items-center mb-6">
          <Image
            source={{ uri: counsellor.photoURL || undefined }}
            className="w-24 h-24 rounded-full mb-4"
          />
          <Text className="text-2xl font-bold text-foreground text-center">
            {counsellor.displayName}
          </Text>
          <Text className="text-muted-foreground text-center">
            {counsellor.licenseType}
          </Text>
          {counsellor.averageRating && (
            <View className="flex-row items-center mt-2">
              <Text className="text-yellow-500 text-lg">⭐</Text>
              <Text className="text-foreground ml-1">
                {counsellor.averageRating.toFixed(1)} (
                {counsellor.totalReviews || 0} reviews)
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="flex-row space-x-3 mb-6">
          <Button onPress={handleStartChat} className="flex-1">
            <Text className="text-primary-foreground">💬 Chat</Text>
          </Button>
          <Button
            onPress={handleVideoCall}
            variant="outline"
            className="flex-1"
          >
            <Text className="text-foreground">📹 Video Call</Text>
          </Button>
          <Button
            onPress={handleBookSession}
            variant="outline"
            className="flex-1"
          >
            <Text className="text-foreground">📅 Book</Text>
          </Button>
        </View>

        {/* Professional Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <View>
              <Text className="font-medium text-foreground">Experience</Text>
              <Text className="text-muted-foreground">
                {counsellor.yearsExperience} years
              </Text>
            </View>
            <View>
              <Text className="font-medium text-foreground">License</Text>
              <Text className="text-muted-foreground">
                {counsellor.licenseType} #{counsellor.licenseNumber}
              </Text>
            </View>
            <View>
              <Text className="font-medium text-foreground">Rate</Text>
              <Text className="text-muted-foreground">
                ${counsellor.hourlyRate}/hour
              </Text>
            </View>
            <View>
              <Text className="font-medium text-foreground">Languages</Text>
              <Text className="text-muted-foreground">
                {counsellor.languages?.join(", ") || "English"}
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Specializations */}
        {counsellor.specializations &&
          counsellor.specializations.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Specializations</CardTitle>
              </CardHeader>
              <CardContent>
                <View className="flex-row flex-wrap gap-2">
                  {counsellor.specializations.map((spec, index) => (
                    <View
                      key={index}
                      className="px-3 py-1 bg-primary/10 rounded-full"
                    >
                      <Text className="text-primary text-sm">
                        {spec
                          .replace("-", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Text>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          )}

        {/* Therapy Approaches */}
        {counsellor.approaches && counsellor.approaches.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Therapy Approaches</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="flex-row flex-wrap gap-2">
                {counsellor.approaches.map((approach, index) => (
                  <View
                    key={index}
                    className="px-3 py-1 bg-secondary/10 rounded-full"
                  >
                    <Text className="text-secondary-foreground text-sm">
                      {approach}
                    </Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        )}

        {/* Age Groups */}
        {counsellor.ageGroups && counsellor.ageGroups.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Age Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-muted-foreground">
                Works with: {counsellor.ageGroups.join(", ")}
              </Text>
            </CardContent>
          </Card>
        )}

        {/* About Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="text-muted-foreground">
              {counsellor.displayName} is a licensed
              {counsellor.licenseType.toLowerCase()} with
              {counsellor.yearsExperience} years of experience. They specialize
              in helping clients with
              {counsellor.specializations?.slice(0, 3).join(", ") ||
                "various mental health concerns"}
              .
            </Text>
          </CardContent>
        </Card>

        {/* Availability Status */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <View className="flex-row items-center">
              <View
                className={`w-3 h-3 rounded-full mr-3 ${
                  counsellor.acceptsNewClients ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <Text className="text-foreground">
                {counsellor.acceptsNewClients
                  ? "Accepting new clients"
                  : "Not accepting new clients"}
              </Text>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
