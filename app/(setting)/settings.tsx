import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebaseConfig";
import { useColorScheme } from "@/lib/useColorScheme";
import {
    deleteProfilePhoto,
    updateUserProfile,
    uploadProfilePhoto,
} from "@/services/userService";
import { MENTAL_HEALTH_CONCERNS, UserProfileData } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { deleteUser } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    Switch,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { user, userProfile, logout, refreshUserProfile } = useAuth();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Premium animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Premium Material Design 3 colors - desaturated for mental health
  const colors = {
    background: isDarkColorScheme ? "#0F1117" : "#FFFFFF",
    surface: isDarkColorScheme ? "#151923" : "#FFFFFF",
    surfaceVariant: isDarkColorScheme ? "#1C2128" : "#F9FBFB",
    text: isDarkColorScheme ? "#E5E7EB" : "#1F2937",
    textSecondary: isDarkColorScheme ? "#9CA3AF" : "#6B7280",
    primary: "#2AA79D",
    primaryContainer: isDarkColorScheme ? "rgba(42, 167, 157, 0.15)" : "rgba(42, 167, 157, 0.08)",
    border: isDarkColorScheme ? "#374151" : "#E5E7EB",
    error: "#E57373",
    errorContainer: isDarkColorScheme ? "rgba(229, 115, 115, 0.15)" : "rgba(229, 115, 115, 0.08)",
    success: "#48A9A6",
  };

  const userProfileData = userProfile as UserProfileData;

  const [editForm, setEditForm] = useState({
    firstName: userProfileData?.firstName || "",
    lastName: userProfileData?.lastName || "",
    displayName: userProfileData?.displayName || "",
    primaryConcerns: userProfileData?.primaryConcerns || [],
    preferredCounsellorGender:
      userProfileData?.preferredCounsellorGender || "no-preference",
    preferredSessionType: userProfileData?.preferredSessionType || "any",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    sessionReminders: true,
    messageNotifications: true,
  });

  const handleSaveProfile = async () => {
    if (!user || !userProfile) return;

    setLoading(true);
    try {
      const updatedData = {
        ...editForm,
        displayName: `${editForm.firstName} ${editForm.lastName}`,
      };

      await updateUserProfile(user.uid, updatedData);
      await refreshUserProfile();
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = () => {
    setShowImagePicker(true);
  };

  const pickImage = async (useCamera: boolean = false) => {
    setShowImagePicker(false);

    const permissionResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission needed",
        "Please grant camera/gallery access to upload photos",
      );
      return;
    }

    setUploadingPhoto(true);
    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        const photoURL = await uploadProfilePhoto(
          user!.uid,
          result.assets[0].uri,
        );
        await updateUserProfile(user!.uid, { photoURL });
        await refreshUserProfile();
        Alert.alert("Success", "Profile photo updated successfully");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove your profile photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setUploadingPhoto(true);
            try {
              await deleteProfilePhoto(user!.uid);
              await updateUserProfile(user!.uid, { photoURL: null });
              await refreshUserProfile();
              Alert.alert("Success", "Profile photo removed");
            } catch (error) {
              Alert.alert("Error", "Failed to remove photo");
            } finally {
              setUploadingPhoto(false);
            }
          },
        },
      ],
    );
  };

  const handleConcernToggle = (concern: string) => {
    setEditForm((prev) => ({
      ...prev,
      primaryConcerns: prev.primaryConcerns.includes(concern)
        ? prev.primaryConcerns.filter((c) => c !== concern)
        : [...prev.primaryConcerns, concern],
    }));
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== "delete") {
      Alert.alert("Error", 'Please type "delete" to confirm account deletion');
      return;
    }

    setLoading(true);
    try {
      // Delete user data from Firestore
      await deleteDoc(doc(db, "users", user!.uid));

      // Delete user authentication account
      await deleteUser(user!);

      Alert.alert(
        "Account Deleted",
        "Your account has been permanently deleted.",
      );
    } catch (error: any) {
      console.error("Delete account error:", error);
      if (error.code === "auth/requires-recent-login") {
        Alert.alert(
          "Re-authentication Required",
          "For security reasons, please sign out and sign back in before deleting your account.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Sign Out",
              onPress: async () => {
                try {
                  await logout();
                } catch (logoutError) {
                  Alert.alert("Error", "Failed to sign out");
                }
              },
            },
          ],
        );
      } else {
        Alert.alert("Error", "Failed to delete account. Please try again.");
      }
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
    }
  };

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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 12, fontSize: 16 }}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "bottom"]}>
        <StatusBar
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          backgroundColor={colors.background}
        />
        
        {/* Premium Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.surfaceVariant,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: colors.text,
            letterSpacing: -0.3,
          }}>Settings</Text>
          
          <TouchableOpacity 
            onPress={() => setIsEditing(!isEditing)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: isEditing ? colors.errorContainer : colors.primaryContainer,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons
              name={isEditing ? "close" : "create-outline"}
              size={22}
              color={isEditing ? colors.error : colors.primary}
            />
          </TouchableOpacity>
        </View>

      <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          >
            {/* Profile Photo Section - Only show when editing */}
            {isEditing && (
              <View style={{
                backgroundColor: colors.surface,
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: colors.primaryContainer,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}>
                    <Ionicons name="camera-outline" size={18} color={colors.primary} />
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>Profile Photo</Text>
                </View>

                <View style={{ alignItems: 'center' }}>
                  <View style={{ position: 'relative', marginBottom: 16 }}>
                    <Avatar alt={userProfile.displayName || "User"} className="w-28 h-28">
                      {userProfile.photoURL ? (
                        <AvatarImage source={{ uri: userProfile.photoURL }} />
                      ) : (
                        <AvatarFallback style={{ backgroundColor: colors.primaryContainer }}>
                          <Text style={{ color: colors.primary, fontSize: 28, fontWeight: 'bold' }}>
                            {userProfile.displayName?.charAt(0)?.toUpperCase() || "U"}
                          </Text>
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {uploadingPhoto && (
                      <View style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        borderRadius: 56,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <ActivityIndicator color="white" />
                      </View>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                    <TouchableOpacity
                      onPress={handleImagePicker}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 12,
                        borderRadius: 12,
                        backgroundColor: colors.primaryContainer,
                      }}
                    >
                      <Ionicons name="camera" size={18} color={colors.primary} />
                      <Text style={{ color: colors.primary, marginLeft: 8, fontWeight: '600' }}>Change</Text>
                    </TouchableOpacity>
                    {userProfile.photoURL && (
                      <TouchableOpacity
                        onPress={handleRemovePhoto}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingVertical: 12,
                          borderRadius: 12,
                          backgroundColor: colors.errorContainer,
                        }}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                        <Text style={{ color: colors.error, marginLeft: 8, fontWeight: '600' }}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Personal Information */}
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: colors.primaryContainer,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="person-outline" size={18} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>Personal Information</Text>
              </View>

              {isEditing ? (
                <View style={{ gap: 16 }}>
                  <View>
                    <Label style={{ marginBottom: 8 }}>First Name</Label>
                    <Input
                      value={editForm.firstName}
                      onChangeText={(text) => setEditForm((prev) => ({ ...prev, firstName: text }))}
                      placeholder="First name"
                      style={{ backgroundColor: colors.surfaceVariant, borderColor: colors.border }}
                    />
                  </View>
                  <View>
                    <Label style={{ marginBottom: 8 }}>Last Name</Label>
                    <Input
                      value={editForm.lastName}
                      onChangeText={(text) => setEditForm((prev) => ({ ...prev, lastName: text }))}
                      placeholder="Last name"
                      style={{ backgroundColor: colors.surfaceVariant, borderColor: colors.border }}
                    />
                  </View>
                </View>
              ) : (
                <View style={{ gap: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Name</Text>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>
                      {userProfileData?.firstName} {userProfileData?.lastName}
                    </Text>
                  </View>
                  <View style={{ height: 1, backgroundColor: colors.border }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Email</Text>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>
                      {userProfile.email}
                    </Text>
                  </View>
                  <View style={{ height: 1, backgroundColor: colors.border }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Member since</Text>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>
                      {userProfile.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                    </Text>
                  </View>
                </View>
              )}
            </View>

          {/* Mental Health Preferences - Only when editing */}
            {isEditing && (
              <View style={{
                backgroundColor: colors.surface,
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: 'rgba(236, 72, 153, 0.1)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}>
                    <Ionicons name="heart-outline" size={18} color="#EC4899" />
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>Mental Health Preferences</Text>
                </View>

                <View style={{ gap: 20 }}>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 12 }}>
                      Primary Concerns
                    </Text>
                    <ScrollView style={{ maxHeight: 130 }} showsVerticalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {MENTAL_HEALTH_CONCERNS.slice(0, 12).map((concern) => {
                          const isSelected = editForm.primaryConcerns.includes(concern);
                          return (
                            <Pressable
                              key={concern}
                              onPress={() => handleConcernToggle(concern)}
                              style={{
                                paddingHorizontal: 14,
                                paddingVertical: 8,
                                borderRadius: 20,
                                borderWidth: 1.5,
                                backgroundColor: isSelected ? colors.primary : 'transparent',
                                borderColor: isSelected ? colors.primary : colors.border,
                              }}
                            >
                              <Text style={{
                                fontSize: 13,
                                fontWeight: '500',
                                color: isSelected ? '#FFFFFF' : colors.text,
                              }}>
                                {concern.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>

                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 12 }}>
                      Preferred Counsellor Gender
                    </Text>
                    <View style={{ gap: 8 }}>
                      {[
                        { value: "no-preference", label: "No preference", icon: "people-outline" },
                        { value: "male", label: "Male", icon: "man-outline" },
                        { value: "female", label: "Female", icon: "woman-outline" },
                      ].map((option) => {
                        const isSelected = editForm.preferredCounsellorGender === option.value;
                        return (
                          <Pressable
                            key={option.value}
                            onPress={() => setEditForm((prev) => ({
                              ...prev,
                              preferredCounsellorGender: option.value as any,
                            }))}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              padding: 14,
                              borderRadius: 12,
                              borderWidth: 1.5,
                              backgroundColor: isSelected ? colors.primaryContainer : 'transparent',
                              borderColor: isSelected ? colors.primary : colors.border,
                            }}
                          >
                            <Ionicons 
                              name={option.icon as any} 
                              size={20} 
                              color={isSelected ? colors.primary : colors.textSecondary} 
                            />
                            <Text style={{
                              marginLeft: 12,
                              fontSize: 15,
                              fontWeight: isSelected ? '600' : '500',
                              color: isSelected ? colors.primary : colors.text,
                            }}>{option.label}</Text>
                            {isSelected && (
                              <View style={{ marginLeft: 'auto' }}>
                                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                              </View>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Notification Settings */}
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="notifications-outline" size={18} color="#F59E0B" />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>Notifications</Text>
              </View>

              <View style={{ gap: 16 }}>
                {Object.entries(notificationSettings).map(([key, value], index, arr) => (
                  <View key={key}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: colors.text, fontSize: 15, fontWeight: '500' }}>
                        {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                      </Text>
                      <Switch
                        value={value}
                        onValueChange={(newValue) =>
                          setNotificationSettings((prev) => ({ ...prev, [key]: newValue }))
                        }
                        trackColor={{ false: colors.surfaceVariant, true: 'rgba(99, 102, 241, 0.3)' }}
                        thumbColor={value ? colors.primary : colors.textSecondary}
                      />
                    </View>
                    {index < arr.length - 1 && (
                      <View style={{ height: 1, backgroundColor: colors.border, marginTop: 16 }} />
                    )}
                  </View>
                ))}
              </View>
            </View>

          {/* Quick Actions */}
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="flash-outline" size={18} color={colors.success} />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>Quick Actions</Text>
              </View>

              <View style={{ gap: 12 }}>
                {[
                  { icon: "chatbubbles-outline", label: "My Conversations", route: "/chat", color: "#2AA79D" },
                  { icon: "calendar-outline", label: "My Sessions", route: "/(main)/sessions", color: "#3A9C94" },
                  { icon: "add-circle-outline", label: "Book New Session", route: "/(session)/book-session", color: "#248F87" },
                ].map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => router.push(action.route as any)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 16,
                      borderRadius: 14,
                      backgroundColor: colors.surfaceVariant,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: `${action.color}15`,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 14,
                      }}>
                        <Ionicons name={action.icon as any} size={20} color={action.color} />
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{action.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Legal & About Section */}
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: 'rgba(100, 116, 139, 0.1)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="document-text-outline" size={18} color="#64748B" />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>Legal & About</Text>
              </View>

              <View style={{ gap: 12 }}>
                {[
                  { icon: "shield-checkmark-outline", label: "Privacy Policy", url: "https://github.com/akashmahlax/MindSets/blob/main/PRIVACY_POLICY.md", color: "#2AA79D" },
                  { icon: "document-outline", label: "Terms of Service", url: "https://github.com/akashmahlax/MindSets/blob/main/TERMS_OF_SERVICE.md", color: "#3A9C94" },
                  { icon: "information-circle-outline", label: "About MindSets", url: null, color: "#64748B" },
                ].map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={async () => {
                      if (item.url) {
                        const { Linking } = await import('react-native');
                        Linking.openURL(item.url);
                      } else {
                        Alert.alert(
                          "About MindSets",
                          "MindSets v1.0.0\n\nA mental health platform connecting you with licensed counsellors for video therapy sessions.\n\n© 2025 MindSets. All rights reserved.",
                          [{ text: "OK" }]
                        );
                      }
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 16,
                      borderRadius: 14,
                      backgroundColor: colors.surfaceVariant,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: `${item.color}15`,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 14,
                      }}>
                        <Ionicons name={item.icon as any} size={20} color={item.color} />
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{item.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ 
                fontSize: 12, 
                color: colors.textSecondary, 
                textAlign: 'center', 
                marginTop: 16 
              }}>
                Version 1.0.0 • Made with 💚 for mental wellness
              </Text>
            </View>

            {/* Save Button - Only when editing */}
            {isEditing && (
              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={loading}
                style={{ marginBottom: 16, overflow: 'hidden', borderRadius: 16 }}
              >
                <LinearGradient
                  colors={['#2AA79D', '#3A9C94']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 10 }} />
                      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Saving...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Save Changes</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Account Actions */}
            {!isEditing && (
              <View style={{ gap: 12, marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={handleLogout}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 16,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  }}
                >
                  <Ionicons name="log-out-outline" size={20} color={colors.error} />
                  <Text style={{ color: colors.error, marginLeft: 10, fontSize: 16, fontWeight: '600' }}>
                    Sign Out
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowDeleteConfirm(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 16,
                    borderRadius: 14,
                    backgroundColor: colors.errorContainer,
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                  <Text style={{ color: colors.error, marginLeft: 10, fontSize: 16, fontWeight: '600' }}>
                    Delete Account
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

      {/* Image Picker Modal */}
        <Modal
          visible={showImagePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowImagePicker(false)}
        >
          <Pressable 
            style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
            onPress={() => setShowImagePicker(false)}
          >
            <View style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              paddingBottom: insets.bottom + 24,
            }}>
              <View style={{
                width: 36,
                height: 4,
                backgroundColor: colors.border,
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 20,
              }} />
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.text,
                textAlign: 'center',
                marginBottom: 24,
              }}>Change Profile Photo</Text>
              
              <View style={{ gap: 12 }}>
                <TouchableOpacity
                  onPress={() => pickImage(true)}
                  style={{ overflow: 'hidden', borderRadius: 14 }}
                >
                  <LinearGradient
                    colors={['#2AA79D', '#3A9C94']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 16,
                    }}
                  >
                    <Ionicons name="camera" size={20} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', marginLeft: 10, fontSize: 16, fontWeight: '600' }}>
                      Take Photo
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => pickImage(false)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 16,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                  }}
                >
                  <Ionicons name="images" size={20} color={colors.text} />
                  <Text style={{ color: colors.text, marginLeft: 10, fontSize: 16, fontWeight: '600' }}>
                    Choose from Gallery
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowImagePicker(false)}
                  style={{
                    alignItems: 'center',
                    paddingVertical: 14,
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>

        {/* Delete Account Confirmation Modal */}
        <Modal
          visible={showDeleteConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            paddingHorizontal: 24,
          }}>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              padding: 24,
              width: '100%',
              maxWidth: 360,
            }}>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: colors.errorContainer,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                  <Ionicons name="warning" size={36} color={colors.error} />
                </View>
                <Text style={{
                  fontSize: 22,
                  fontWeight: '700',
                  color: colors.text,
                  marginBottom: 8,
                }}>Delete Account</Text>
                <Text style={{
                  fontSize: 15,
                  color: colors.textSecondary,
                  textAlign: 'center',
                  lineHeight: 22,
                }}>
                  This action cannot be undone. All your data will be permanently deleted.
                </Text>
              </View>

              <View style={{ gap: 16 }}>
                <View>
                  <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: 8,
                  }}>Type &quot;delete&quot; to confirm:</Text>
                  <Input
                    value={deleteConfirmText}
                    onChangeText={setDeleteConfirmText}
                    placeholder="delete"
                    autoCapitalize="none"
                    style={{ backgroundColor: colors.surfaceVariant, borderColor: colors.border }}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: colors.border,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleDeleteAccount}
                    disabled={loading || deleteConfirmText.toLowerCase() !== "delete"}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: deleteConfirmText.toLowerCase() === "delete" ? colors.error : colors.surfaceVariant,
                      alignItems: 'center',
                      opacity: (loading || deleteConfirmText.toLowerCase() !== "delete") ? 0.5 : 1,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Delete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Animated.View>
  );
}
