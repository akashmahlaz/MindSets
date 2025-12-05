import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { useVideo } from "../../context/VideoContext";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";

interface CallSetupProps {
  targetUser: {
    id: string;
    name: string;
    image?: string;
  };
  onCallCreated?: (call: any) => void;
  onCancel?: () => void;
}

export const CallSetup: React.FC<CallSetupProps> = ({
  targetUser,
  onCallCreated,
  onCancel,
}) => {
  const { createCall, isVideoConnected } = useVideo();
  const [isCreatingCall, setIsCreatingCall] = useState(false);

  const handleStartCall = async (isVideo: boolean) => {
    if (!isVideoConnected) {
      Alert.alert("Error", "Video service is not connected. Please try again.");
      return;
    }

    try {
      setIsCreatingCall(true);

      // Generate unique call ID
      const callId = `call-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      // Create the call
      const call = await createCall(callId, [targetUser.id], isVideo);

      if (call) {
        console.log("Call created successfully:", call.cid);

        // Navigate to call screen
        router.push({
          pathname: "/call/[callId]",
          params: {
            callId: call.id,
            callType: call.type,
            isVideo: isVideo.toString(),
          },
        });

        onCallCreated?.(call);
      } else {
        Alert.alert("Error", "Failed to create call. Please try again.");
      }
    } catch (error) {
      console.error("Error starting call:", error);
      Alert.alert(
        "Error",
        "Failed to start call. Please check your connection and try again.",
      );
    } finally {
      setIsCreatingCall(false);
    }
  };

  const getUserInitials = (name: string): string => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <ThemedView style={styles.container}>
      <Card style={styles.card}>
        <CardHeader style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <Avatar style={styles.avatar} alt="User Avatar">
              {targetUser.image ? (
                <AvatarImage source={{ uri: targetUser.image }} />
              ) : (
                <AvatarFallback>
                  <ThemedText style={styles.avatarText}>
                    {getUserInitials(targetUser.name)}
                  </ThemedText>
                </AvatarFallback>
              )}
            </Avatar>
            <View style={styles.userDetails}>
              <CardTitle style={styles.userName}>{targetUser.name}</CardTitle>
              <CardDescription>Choose call type</CardDescription>
            </View>
          </View>
        </CardHeader>

        <CardContent style={styles.cardContent}>
          <View style={styles.callOptions}>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleStartCall(false)}
              disabled={isCreatingCall}
            >
              <View style={[styles.callButtonContent, styles.audioCall]}>
                <Ionicons name="call" size={32} color="#fff" />
                <ThemedText style={styles.callButtonText}>
                  Audio Call
                </ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleStartCall(true)}
              disabled={isCreatingCall}
            >
              <View style={[styles.callButtonContent, styles.videoCall]}>
                <Ionicons name="videocam" size={32} color="#fff" />
                <ThemedText style={styles.callButtonText}>
                  Video Call
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>

          {isCreatingCall && (
            <View style={styles.loadingContainer}>
              <ThemedText style={styles.loadingText}>
                Starting call...
              </ThemedText>
            </View>
          )}

          <View style={styles.actions}>
            <Button
              variant="outline"
              onPress={onCancel}
              disabled={isCreatingCall}
              style={styles.cancelButton}
            >
              <ThemedText>Cancel</ThemedText>
            </Button>
          </View>
        </CardContent>
      </Card>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
  },
  cardHeader: {
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  avatar: {
    width: 64,
    height: 64,
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardContent: {
    paddingTop: 20,
  },
  callOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  callButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  callButtonContent: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  audioCall: {
    backgroundColor: "#2AA79D",
  },
  videoCall: {
    backgroundColor: "#3A9C94",
  },
  callButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
  },
  cancelButton: {
    minWidth: 120,
  },
});
