import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/lib/useColorScheme';
import { deleteProfilePhoto, updateUserProfile, uploadProfilePhoto } from '@/services/userService';
import { MENTAL_HEALTH_CONCERNS, UserProfileData } from '@/types/user';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UserProfileScreen() {
  const { user, userProfile, logout, refreshUserProfile } = useAuth();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const userProfileData = userProfile as UserProfileData;

  const [editForm, setEditForm] = useState({
    firstName: userProfileData?.firstName || '',
    lastName: userProfileData?.lastName || '',
    displayName: userProfileData?.displayName || '',
    primaryConcerns: userProfileData?.primaryConcerns || [],
    preferredCounsellorGender: userProfileData?.preferredCounsellorGender || 'no-preference',
    preferredSessionType: userProfileData?.preferredSessionType || 'any',
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
          <Text className="text-foreground mt-2">Loading profile...</Text>
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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDarkColorScheme ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-foreground">Profile</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Text className="text-primary font-medium">
            {isEditing ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {/* Profile Photo Section */}
        <Card className="mb-6">
          <CardContent className="p-6 items-center">
            <View className="relative">
              <Avatar alt={userProfile.displayName || 'User'} className="w-24 h-24 mb-4">
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

            <Text className="text-xl font-semibold text-foreground mb-1">
              {userProfile.displayName}
            </Text>
            <Text className="text-muted-foreground mb-4">{userProfile.email}</Text>

            <View className="flex-row space-x-3">
              <Button variant="outline" onPress={handleImagePicker} className="flex-1">
                <Text className="text-foreground">Change Photo</Text>
              </Button>
              {userProfile.photoURL && (
                <Button variant="outline" onPress={handleRemovePhoto} className="flex-1">
                  <Text className="text-destructive">Remove</Text>
                </Button>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
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
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Name</Text>
                  <Text className="text-foreground font-medium">
                    {userProfileData?.firstName} {userProfileData?.lastName}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Email</Text>
                  <Text className="text-foreground font-medium">{userProfile.email}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Member since</Text>
                  <Text className="text-foreground font-medium">
                    {userProfile.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </Text>
                </View>
              </>
            )}
          </CardContent>
        </Card>

        {/* Mental Health Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Mental Health Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <View className="space-y-2">
                  <Label>Primary Concerns</Label>
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
              </>
            ) : (
              <>
                <View>
                  <Text className="text-muted-foreground mb-2">Primary Concerns</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {userProfileData?.primaryConcerns?.map((concern) => (
                      <View key={concern} className="px-3 py-1 bg-primary/10 rounded-full">
                        <Text className="text-primary text-sm">
                          {concern.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Text>
                      </View>
                    )) || <Text className="text-muted-foreground">Not specified</Text>}
                  </View>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Preferred Counsellor</Text>
                  <Text className="text-foreground font-medium capitalize">
                    {userProfileData?.preferredCounsellorGender?.replace('-', ' ') || 'Not specified'}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Session Type</Text>
                  <Text className="text-foreground font-medium capitalize">
                    {userProfileData?.preferredSessionType || 'Any'}
                  </Text>
                </View>
              </>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        {userProfileData?.emergencyContact && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {isEditing ? (
          <View className="space-y-3 mb-6">
            <Button onPress={handleSaveProfile} disabled={loading} className="w-full">
              <Text className="text-primary-foreground font-medium">
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </Button>
          </View>
        ) : (
          <View className="space-y-3 mb-6">
            <Button variant="outline" onPress={() => router.push('/chat')} className="w-full">
              <Text className="text-foreground">My Messages</Text>
            </Button>
            <Button variant="outline" onPress={handleLogout} className="w-full">
              <Text className="text-destructive">Sign Out</Text>
            </Button>
          </View>
        )}
      </ScrollView>

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
                <Text className="text-primary-foreground">Take Photo</Text>
              </Button>
              <Button variant="outline" onPress={() => pickImage(false)} className="w-full">
                <Text className="text-foreground">Choose from Gallery</Text>
              </Button>
              <Button variant="ghost" onPress={() => setShowImagePicker(false)} className="w-full">
                <Text className="text-muted-foreground">Cancel</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
