import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { UserProfileData } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UserProfileScreen() {
  const { userProfile, logout } = useAuth();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();

  const userProfileData = userProfile as UserProfileData;

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            Alert.alert("Error", "Failed to sign out");
          }
        },
      },
    ]);
  };

  if (!userProfile) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
          <Text className="text-foreground mt-2">Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? "#0f172a" : "#ffffff"}
      />
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDarkColorScheme ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-foreground">Profile</Text>
        <TouchableOpacity onPress={() => router.push("/(setting)/settings")}>
          <Ionicons
            name="settings-outline"
            size={24}
            color={isDarkColorScheme ? "#fff" : "#000"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {/* Profile Photo Section */}
        <Card className="mb-6">
          <CardContent className="p-6 items-center">
            <Avatar
              alt={userProfile.displayName || "User"}
              className="w-24 h-24 mb-4"
            >
              {userProfile.photoURL ? (
                <AvatarImage source={{ uri: userProfile.photoURL }} />
              ) : (
                <AvatarFallback className="bg-primary/10">
                  <Text className="text-primary text-2xl font-bold">
                    {userProfile.displayName?.charAt(0)?.toUpperCase() || "U"}
                  </Text>
                </AvatarFallback>
              )}
            </Avatar>

            <Text className="text-xl font-semibold text-foreground mb-1">
              {userProfile.displayName}
            </Text>
            <Text className="text-muted-foreground mb-4">
              {userProfile.email}
            </Text>
          </CardContent>
        </Card>
        {/* Personal Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Name</Text>
              <Text className="text-foreground font-medium">
                {userProfileData?.firstName} {userProfileData?.lastName}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Email</Text>
              <Text className="text-foreground font-medium">
                {userProfile.email}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Member since</Text>
              <Text className="text-foreground font-medium">
                {userProfile.createdAt?.toDate?.()?.toLocaleDateString() ||
                  "N/A"}
              </Text>
            </View>
          </CardContent>
        </Card>
        {/* Mental Health Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Mental Health Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <View>
              <Text className="text-muted-foreground mb-2">
                Primary Concerns
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {userProfileData?.primaryConcerns?.map((concern) => (
                  <View
                    key={concern}
                    className="px-3 py-1 bg-primary/10 rounded-full"
                  >
                    <Text className="text-primary text-sm">
                      {concern
                        .replace("-", " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                  </View>
                )) || (
                  <Text className="text-muted-foreground">Not specified</Text>
                )}
              </View>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">
                Preferred Counsellor
              </Text>
              <Text className="text-foreground font-medium capitalize">
                {userProfileData?.preferredCounsellorGender?.replace(
                  "-",
                  " ",
                ) || "Not specified"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Session Type</Text>
              <Text className="text-foreground font-medium capitalize">
                {userProfileData?.preferredSessionType || "Any"}
              </Text>
            </View>
          </CardContent>
        </Card>
        {/* Emergency Contact */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {userProfileData?.emergencyContact ? (
              <>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Name</Text>
                  <Text className="text-foreground font-medium">
                    {userProfileData.emergencyContact.name}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Relationship</Text>
                  <Text className="text-foreground font-medium">
                    {userProfileData.emergencyContact.relationship}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Phone</Text>
                  <Text className="text-foreground font-medium">
                    {userProfileData.emergencyContact.phone}
                  </Text>
                </View>
              </>
            ) : (
              <Text className="text-muted-foreground text-center py-4">
                No emergency contact information provided
              </Text>
            )}
          </CardContent>
        </Card>
        {/* Quick Actions */}
        <View className="space-y-3 mb-6">
          <Button
            variant="outline"
            onPress={() => router.push("/chat")}
            className="w-full flex-row items-center justify-center gap-2"
          >
            <Ionicons
              name="chatbubbles-outline"
              size={20}
              color={isDarkColorScheme ? "#fff" : "#000"}
            />
            <Text className="text-foreground">See All Chats</Text>
          </Button>

          <Button
            variant="outline"
            onPress={() => router.push("/(main)/sessions")}
            className="w-full flex-row items-center justify-center gap-2"
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={isDarkColorScheme ? "#fff" : "#000"}
            />
            <Text className="text-foreground">My Sessions</Text>
          </Button>

          <Button variant="outline" onPress={handleLogout} className="w-full">
            <Text className="text-destructive">Sign Out</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
