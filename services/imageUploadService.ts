import { storage } from '@/firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Alert } from 'react-native';

export interface ImageUploadResult {
  url: string;
  path: string;
}

export class ImageUploadService {
  /**
   * Request permissions for camera and media library
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      // Request media library permissions
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraPermission.status !== 'granted' || mediaLibraryPermission.status !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Please grant camera and photo library permissions to upload images.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Show image picker options (camera or gallery)
   */
  static async pickImage(): Promise<ImagePicker.ImagePickerResult | null> {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        return null;
      }

      return new Promise((resolve) => {
        Alert.alert(
          'Select Image',
          'Choose how you want to select an image',
          [
            {
              text: 'Camera',
              onPress: async () => {
                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [16, 9],
                  quality: 0.8,
                  exif: false,
                });
                resolve(result);
              },
            },
            {
              text: 'Gallery',
              onPress: async () => {
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [16, 9],
                  quality: 0.8,
                  exif: false,
                });
                resolve(result);
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(null),
            },
          ]
        );
      });
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
      return null;
    }
  }

  /**
   * Upload image to Firebase Storage
   */
  static async uploadImage(
    imageUri: string,
    folder: string = 'articles',
    fileName?: string
  ): Promise<ImageUploadResult> {
    try {
      // Generate unique filename if not provided
      const timestamp = Date.now();
      const finalFileName = fileName || `image_${timestamp}.jpg`;
      const imagePath = `${folder}/${finalFileName}`;
      
      // Create storage reference
      const imageRef = ref(storage, imagePath);
      
      // Convert image URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Upload image
      await uploadBytes(imageRef, blob);
      
      // Get download URL
      const downloadURL = await getDownloadURL(imageRef);
      
      return {
        url: downloadURL,
        path: imagePath,
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Delete image from Firebase Storage
   */
  static async deleteImage(imagePath: string): Promise<void> {
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw error for deletion as it's not critical
    }
  }

  /**
   * Complete flow: pick and upload image
   */
  static async pickAndUploadImage(
    folder: string = 'articles',
    fileName?: string
  ): Promise<ImageUploadResult | null> {
    try {
      // Pick image
      const pickerResult = await this.pickImage();
      
      if (!pickerResult || pickerResult.canceled || !pickerResult.assets?.[0]) {
        return null;
      }
      
      const imageUri = pickerResult.assets[0].uri;
      
      // Upload image
      const uploadResult = await this.uploadImage(imageUri, folder, fileName);
      
      return uploadResult;
    } catch (error) {
      console.error('Error in pick and upload flow:', error);
      Alert.alert('Error', 'Failed to upload image');
      return null;
    }
  }
}

export default ImageUploadService;
