import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebaseConfig';
import { useColorScheme } from '@/lib/useColorScheme';
import { deleteProfilePhoto, updateUserProfile, uploadProfilePhoto } from '@/services/userService';
import { MENTAL_HEALTH_CONCERNS, UserProfileData } from '@/types/user';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { deleteUser } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { user, userProfile, logout, refreshUserProfile } = useAuth();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const userProfileData = userProfile as UserProfileData;

  const [editForm, setEditForm] = useState({
    firstName: userProfileData?.firstName || '',
    lastName: userProfileData?.lastName || '',
    displayName: userProfileData?.displayName || '',
    primaryConcerns: userProfileData?.primaryConcerns || [],
    preferredCounsellorGender: userProfileData?.preferredCounsellorGender || 'no-preference',
    preferredSessionType: userProfileData?.preferredSessionType || 'any',
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
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
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
      Alert.alert('Permission needed', 'Please grant camera/gallery access to upload photos');
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
        const photoURL = await uploadProfilePhoto(user!.uid, result.assets[0].uri);
        await updateUserProfile(user!.uid, { photoURL });
        await refreshUserProfile();
        Alert.alert('Success', 'Profile photo updated successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setUploadingPhoto(true);
            try {
              await deleteProfilePhoto(user!.uid);
              await updateUserProfile(user!.uid, { photoURL: null });
              await refreshUserProfile();
              Alert.alert('Success', 'Profile photo removed');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove photo');
            } finally {
              setUploadingPhoto(false);
            }
          },
        },
      ]
    );
  };

  const handleConcernToggle = (concern: string) => {
    setEditForm(prev => ({
      ...prev,
      primaryConcerns: prev.primaryConcerns.includes(concern)
        ? prev.primaryConcerns.filter(c => c !== concern)
        : [...prev.primaryConcerns, concern]
    }));
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete') {
      Alert.alert('Error', 'Please type "delete" to confirm account deletion');
      return;
    }

    setLoading(true);
    try {
      // Delete user data from Firestore
      await deleteDoc(doc(db, 'users', user!.uid));
      
      // Delete user authentication account
      await deleteUser(user!);
      
      Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
    } catch (error: any) {
      console.error('Delete account error:', error);
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Re-authentication Required',
          'For security reasons, please sign out and sign back in before deleting your account.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign Out',
              onPress: async () => {
                try {
                  await logout();
                } catch (logoutError) {
                  Alert.alert('Error', 'Failed to sign out');
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to delete account. Please try again.');
      }
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  if (!userProfile) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
          <Text className="text-foreground mt-2">Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar 
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? '#0f172a' : '#ffffff'}
      />
        {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-border">
        <TouchableOpacity onPress={() => router.push('/(main)/profile')}>
          <Ionicons name="arrow-back" size={24} color={isDarkColorScheme ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-foreground">Settings</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Ionicons 
            name={isEditing ? "close" : "create-outline"} 
            size={24} 
            color={isDarkColorScheme ? '#fff' : '#000'} 
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1 px-6 py-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Photo Section - Only show when editing */}
          {isEditing && (
            <Card className="mb-6 shadow-lg border-0 bg-card/95">
              <CardHeader className="pb-4">
                <CardTitle className="flex-row items-center">
                  <Ionicons name="camera-outline" size={20} color={isDarkColorScheme ? '#fff' : '#000'} className="mr-2" />
                  <Text className="text-foreground ml-2">Profile Photo</Text>
                </CardTitle>
              </CardHeader>
              <CardContent className="items-center">
                <View className="relative mb-4">
                  <Avatar alt={userProfile.displayName || 'User'} className="w-24 h-24">
                    {userProfile.photoURL ? (
                      <AvatarImage source={{ uri: userProfile.photoURL }} />
                    ) : (
                      <AvatarFallback className="bg-primary/10">
                        <Text className="text-primary text-2xl font-bold">
                          {userProfile.displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  {uploadingPhoto && (
                    <View className="absolute inset-0 rounded-full bg-black/50 justify-center items-center">
                      <ActivityIndicator color="white" />
                    </View>
                  )}
                </View>

                <View className="flex-row space-x-3 w-full">
                  <Button variant="outline" onPress={handleImagePicker} className="flex-1">
                    <View className="flex-row items-center">
                      <Ionicons name="camera" size={16} color={isDarkColorScheme ? '#fff' : '#000'} />
                      <Text className="text-foreground ml-2">Change Photo</Text>
                    </View>
                  </Button>
                  {userProfile.photoURL && (
                    <Button variant="outline" onPress={handleRemovePhoto} className="flex-1">
                      <View className="flex-row items-center">
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                        <Text className="text-destructive ml-2">Remove</Text>
                      </View>
                    </Button>
                  )}
                </View>
              </CardContent>
            </Card>
          )}

          {/* Personal Information */}
          <Card className="mb-6 shadow-lg border-0 bg-card/95">
            <CardHeader>
              <CardTitle className="flex-row items-center">
                <Ionicons name="person-outline" size={20} color={isDarkColorScheme ? '#fff' : '#000'} />
                <Text className="text-foreground ml-2">Personal Information</Text>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <View className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={editForm.firstName}
                      onChangeText={(text) => setEditForm(prev => ({ ...prev, firstName: text }))}
                      placeholder="First name"
                    />
                  </View>
                  <View className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={editForm.lastName}
                      onChangeText={(text) => setEditForm(prev => ({ ...prev, lastName: text }))}
                      placeholder="Last name"
                    />
                  </View>
                </>
              ) : (
                <>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-muted-foreground">Name</Text>
                    <Text className="text-foreground font-medium">
                      {userProfileData?.firstName} {userProfileData?.lastName}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-muted-foreground">Email</Text>
                    <Text className="text-foreground font-medium">{userProfile.email}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-muted-foreground">Member since</Text>
                    <Text className="text-foreground font-medium">
                      {userProfile.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </Text>
                  </View>
                </>
              )}
            </CardContent>
          </Card>

          {/* Mental Health Preferences - Only when editing */}
          {isEditing && (
            <Card className="mb-6 shadow-lg border-0 bg-card/95">
              <CardHeader>
                <CardTitle className="flex-row items-center">
                  <Ionicons name="heart-outline" size={20} color={isDarkColorScheme ? '#fff' : '#000'} />
                  <Text className="text-foreground ml-2">Mental Health Preferences</Text>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <View className="space-y-2">
                  <Label>Primary Concerns</Label>
                  <ScrollView style={{ maxHeight: 120 }} showsVerticalScrollIndicator={false}>
                    <View className="flex-row flex-wrap gap-2">
                      {MENTAL_HEALTH_CONCERNS.slice(0, 12).map((concern) => (
                        <Pressable
                          key={concern}
                          onPress={() => handleConcernToggle(concern)}
                          className={`px-3 py-2 rounded-full border ${
                            editForm.primaryConcerns.includes(concern)
                              ? 'bg-primary border-primary'
                              : 'bg-background border-border'
                          }`}
                        >
                          <Text className={`text-sm ${
                            editForm.primaryConcerns.includes(concern)
                              ? 'text-primary-foreground'
                              : 'text-foreground'
                          }`}>
                            {concern.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View className="space-y-2">
                  <Label>Preferred Counsellor Gender</Label>
                  <View className="space-y-2">
                    {[
                      { value: 'no-preference', label: 'No preference' },
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' }
                    ].map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => setEditForm(prev => ({ ...prev, preferredCounsellorGender: option.value as any }))}
                        className={`p-3 rounded-lg border ${
                          editForm.preferredCounsellorGender === option.value
                            ? 'bg-primary/10 border-primary'
                            : 'bg-background border-border'
                        }`}
                      >
                        <Text className="text-foreground">{option.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </CardContent>
            </Card>
          )}

          {/* Notification Settings */}
          <Card className="mb-6 shadow-lg border-0 bg-card/95">
            <CardHeader>
              <CardTitle className="flex-row items-center">
                <Ionicons name="notifications-outline" size={20} color={isDarkColorScheme ? '#fff' : '#000'} />
                <Text className="text-foreground ml-2">Notifications</Text>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(notificationSettings).map(([key, value]) => (
                <View key={key} className="flex-row justify-between items-center">
                  <Text className="text-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Text>
                  <Switch
                    value={value}
                    onValueChange={(newValue) => 
                      setNotificationSettings(prev => ({ ...prev, [key]: newValue }))
                    }
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={value ? '#f5dd4b' : '#f4f3f4'}
                  />
                </View>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mb-6 shadow-lg border-0 bg-card/95">
            <CardHeader>
              <CardTitle className="flex-row items-center">
                <Ionicons name="flash-outline" size={20} color={isDarkColorScheme ? '#fff' : '#000'} />
                <Text className="text-foreground ml-2">Quick Actions</Text>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <TouchableOpacity 
                className="flex-row items-center justify-between p-3 rounded-lg border border-border"
                onPress={() => router.push('/chat')}
              >
                <View className="flex-row items-center">
                  <Ionicons name="chatbubbles-outline" size={20} color={isDarkColorScheme ? '#fff' : '#000'} />
                  <Text className="text-foreground ml-3">My Conversations</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDarkColorScheme ? '#888' : '#666'} />
              </TouchableOpacity>

              <TouchableOpacity 
                className="flex-row items-center justify-between p-3 rounded-lg border border-border"
                onPress={() => router.push('/(main)/sessions')}
              >
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={20} color={isDarkColorScheme ? '#fff' : '#000'} />
                  <Text className="text-foreground ml-3">My Sessions</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDarkColorScheme ? '#888' : '#666'} />
              </TouchableOpacity>

              <TouchableOpacity 
                className="flex-row items-center justify-between p-3 rounded-lg border border-border"
                onPress={() => router.push('/(session)/book-session')}
              >
                <View className="flex-row items-center">
                  <Ionicons name="add-circle-outline" size={20} color={isDarkColorScheme ? '#fff' : '#000'} />
                  <Text className="text-foreground ml-3">Book New Session</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDarkColorScheme ? '#888' : '#666'} />
              </TouchableOpacity>
            </CardContent>
          </Card>

          {/* Save Button - Only when editing */}
          {isEditing && (
            <View className="mb-6">
              <Button onPress={handleSaveProfile} disabled={loading} className="w-full h-12">
                {loading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                    <Text className="text-primary-foreground font-medium">Saving...</Text>
                  </View>
                ) : (
                  <Text className="text-primary-foreground font-medium">Save Changes</Text>
                )}
              </Button>
            </View>
          )}

          {/* Account Actions */}
          {!isEditing && (
            <View className="space-y-3 mb-6">
              <Button variant="outline" onPress={handleLogout} className="w-full h-12">
                <View className="flex-row items-center">
                  <Ionicons name="log-out-outline" size={16} color="#ef4444" />
                  <Text className="text-destructive ml-2 font-medium">Sign Out</Text>
                </View>
              </Button>
              
              <Button 
                variant="outline" 
                onPress={() => setShowDeleteConfirm(true)} 
                className="w-full h-12 border-destructive"
              >
                <View className="flex-row items-center">
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  <Text className="text-destructive ml-2 font-medium">Delete Account</Text>
                </View>
              </Button>
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
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-6">
            <Text className="text-xl font-semibold text-foreground mb-4 text-center">
              Change Profile Photo
            </Text>
            <View className="space-y-3">
              <Button onPress={() => pickImage(true)} className="w-full">
                <View className="flex-row items-center">
                  <Ionicons name="camera" size={16} color="#ffffff" />
                  <Text className="text-primary-foreground ml-2">Take Photo</Text>
                </View>
              </Button>
              <Button variant="outline" onPress={() => pickImage(false)} className="w-full">
                <View className="flex-row items-center">
                  <Ionicons name="images" size={16} color={isDarkColorScheme ? '#fff' : '#000'} />
                  <Text className="text-foreground ml-2">Choose from Gallery</Text>
                </View>
              </Button>
              <Button variant="ghost" onPress={() => setShowImagePicker(false)} className="w-full">
                <Text className="text-muted-foreground">Cancel</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-background rounded-2xl p-6 w-full max-w-sm">
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full items-center justify-center mb-3">
                <Ionicons name="warning" size={32} color="#ef4444" />
              </View>
              <Text className="text-xl font-bold text-foreground mb-2">Delete Account</Text>
              <Text className="text-muted-foreground text-center">
                This action cannot be undone. All your data will be permanently deleted.
              </Text>
            </View>
            
            <View className="space-y-4">
              <View>
                <Text className="text-sm text-muted-foreground mb-2">
                  Type "delete" to confirm:
                </Text>
                <Input
                  value={deleteConfirmText}
                  onChangeText={setDeleteConfirmText}
                  placeholder="delete"
                  autoCapitalize="none"
                />
              </View>
              
              <View className="flex-row space-x-3">
                <Button 
                  variant="outline" 
                  onPress={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1"
                >
                  <Text className="text-foreground">Cancel</Text>
                </Button>
                <Button 
                  onPress={handleDeleteAccount}
                  disabled={loading || deleteConfirmText.toLowerCase() !== 'delete'}
                  className="flex-1 bg-destructive"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text className="text-white font-medium">Delete</Text>
                  )}
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
