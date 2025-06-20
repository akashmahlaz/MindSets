import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { channelService } from "@/services/channelService";
import {
  getChannelMembers,
  leaveChannel,
  removeMembersFromChannel,
  updateChannelInfo,
} from "@/services/chatHelpers";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ChannelMember {
  user_id: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  channel_role?: string;
  created_at: string;
}

export default function ChannelInfoScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const { chatClient } = useChat();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [channel, setChannel] = useState<any>(null);
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadChannelInfo();
  }, [channelId]);

  const loadChannelInfo = async () => {
    if (!channelId || !chatClient || !user) return;

    try {
      setLoading(true);

      // Get the channel
      const channelInstance = chatClient.channel("messaging", channelId);
      await channelInstance.watch();
      setChannel(channelInstance);
      // Set channel data - use type assertion for custom data
      const channelData = channelInstance.data as any;
      setChannelName(channelData?.name || channelInstance.id || "");
      setChannelDescription(channelData?.description || "");

      // Check if current user is admin/creator
      const isCreator = channelInstance.data?.created_by_id === user.uid;
      const memberRole = channelInstance.state.members[user.uid]?.channel_role;
      setIsAdmin(
        isCreator ||
          memberRole === "channel_moderator" ||
          memberRole === "admin",
      );

      // Load members
      const membersResult = await getChannelMembers(channelInstance);
      setMembers(membersResult.members || []);
    } catch (error) {
      console.error("Error loading channel info:", error);
      Alert.alert("Error", "Failed to load channel information");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateChannelName = async () => {
    if (!channel || !channelName.trim()) return;

    try {
      await updateChannelInfo(channel, { name: channelName.trim() }, user!);
      setEditingName(false);
      Alert.alert("Success", "Channel name updated");
    } catch (error) {
      console.error("Error updating channel name:", error);
      Alert.alert("Error", "Failed to update channel name");
    }
  };

  const handleUpdateChannelDescription = async () => {
    if (!channel) return;

    try {
      await updateChannelInfo(
        channel,
        { description: channelDescription },
        user!,
      );
      Alert.alert("Success", "Channel description updated");
    } catch (error) {
      console.error("Error updating channel description:", error);
      Alert.alert("Error", "Failed to update channel description");
    }
  };

  const handleRemoveMember = (member: ChannelMember) => {
    if (!isAdmin) return;

    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${member.user.name} from this channel?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeMembersFromChannel(
                channel,
                [member.user_id],
                user!,
                `${member.user.name} was removed from the channel`,
              );
              loadChannelInfo(); // Refresh
              Alert.alert("Success", "Member removed");
            } catch (error) {
              console.error("Error removing member:", error);
              Alert.alert("Error", "Failed to remove member");
            }
          },
        },
      ],
    );
  };

  const handleMakeAdmin = async (member: ChannelMember) => {
    if (!isAdmin || !channel) return;

    try {
      await channelService.addModerators(channel, [member.user_id]);
      loadChannelInfo(); // Refresh
      Alert.alert("Success", `${member.user.name} is now a moderator`);
    } catch (error) {
      console.error("Error making admin:", error);
      Alert.alert("Error", "Failed to make user a moderator");
    }
  };

  const handleLeaveChannel = () => {
    Alert.alert(
      "Leave Channel",
      "Are you sure you want to leave this channel?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveChannel(channel, user!.uid);
              router.back();
            } catch (error) {
              console.error("Error leaving channel:", error);
              Alert.alert("Error", "Failed to leave channel");
            }
          },
        },
      ],
    );
  };

  const handleMuteChannel = async () => {
    if (!channel) return;

    try {
      const muteStatus = channel.muteStatus();
      if (muteStatus.muted) {
        await channel.unmute();
        Alert.alert("Success", "Channel unmuted");
      } else {
        await channel.mute();
        Alert.alert("Success", "Channel muted");
      }
    } catch (error) {
      console.error("Error toggling mute:", error);
      Alert.alert("Error", "Failed to update mute status");
    }
  };

  const renderMemberItem = ({ item: member }: { item: ChannelMember }) => {
    const isModerator =
      member.channel_role === "channel_moderator" ||
      member.channel_role === "admin";
    const isCurrentUser = member.user_id === user?.uid;

    return (
      <TouchableOpacity
        onLongPress={() => {
          if (isAdmin && !isCurrentUser) {
            Alert.alert(
              "Member Actions",
              `Choose an action for ${member.user.name}`,
              [
                { text: "Cancel", style: "cancel" },
                !isModerator && {
                  text: "Make Moderator",
                  onPress: () => handleMakeAdmin(member),
                },
                {
                  text: "Remove from Channel",
                  style: "destructive",
                  onPress: () => handleRemoveMember(member),
                },
              ].filter(Boolean) as any,
            );
          }
        }}
      >
        <Image
          source={{
            uri:
              member.user.image ||
              `https://getstream.io/random_png/?name=${member.user.name}`,
          }}
        />
        <View>
          <Text>{member.user.name}</Text>
          {isModerator && <Text>Moderator</Text>}
          {isCurrentUser && <Text>You</Text>}
        </View>
        {isAdmin && !isCurrentUser && (
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View>
        <ActivityIndicator size="large" />
        <Text>Loading channel info...</Text>
      </View>
    );
  }

  if (!channel) {
    return (
      <View>
        <Text>Channel not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      {/* Header */}
      <View>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text>Channel Info</Text>
        <View />
      </View>

      <ScrollView>
        {/* Channel Name */}
        <View>
          <Text>Channel Name</Text>
          {editingName ? (
            <View>
              <TextInput
                value={channelName}
                onChangeText={setChannelName}
                placeholder="Enter channel name"
                autoFocus
              />
              <View>
                <TouchableOpacity
                  onPress={() => {
                    setEditingName(false);
                    setChannelName(channel.data?.name || "");
                  }}
                >
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleUpdateChannelName}>
                  <Text>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => isAdmin && setEditingName(true)}
              disabled={!isAdmin}
            >
              <Text>{channelName || "No name set"}</Text>
              {isAdmin && <Ionicons name="pencil" size={16} color="#007AFF" />}
            </TouchableOpacity>
          )}
        </View>

        {/* Channel Description */}
        {isAdmin && (
          <View>
            <Text>Description</Text>
            <TextInput
              value={channelDescription}
              onChangeText={setChannelDescription}
              placeholder="Add a description"
              multiline
              numberOfLines={3}
              onBlur={handleUpdateChannelDescription}
            />
          </View>
        )}

        {/* Members */}
        <View>
          <View>
            <Text>Members ({members.length})</Text>
            {isAdmin && (
              <TouchableOpacity
                onPress={() => console.log("Add members not implemented")}
              >
                <Ionicons name="add" size={24} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.user_id}
            scrollEnabled={false}
          />
        </View>

        {/* Actions */}
        <View>
          <TouchableOpacity onPress={handleMuteChannel}>
            <Ionicons name="volume-mute" size={20} color="#666" />
            <Text>Mute Channel</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLeaveChannel}>
            <Ionicons name="exit" size={20} color="#FF3B30" />
            <Text>Leave Channel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
