import { useAuth } from "@/context/AuthContext";
import { createArticle, CreateArticleData } from "@/services/articleService";
import ImageUploadService from "@/services/imageUploadService";
import { UserProfileData } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const categories = [
  "Mental Health",
  "Relationships",
  "Stress Management",
  "Anxiety",
  "Depression",
  "Self-Care",
  "Mindfulness",
  "Personal Growth",
  "Other",
];

export default function CreateArticle() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Mental Health");
  const [tags, setTags] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePath, setImagePath] = useState(""); // For Firebase Storage path
  const [readTime, setReadTime] = useState("5");
  const [isPublished, setIsPublished] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const userProfileData = userProfile as UserProfileData;

  const estimateReadTime = (text: string) => {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    const estimated = estimateReadTime(text);
    setReadTime(estimated.toString());
  };

  const handleImageUpload = async () => {
    try {
      setUploadingImage(true);
      const result = await ImageUploadService.pickAndUploadImage('articles');
      
      if (result) {
        setImageUrl(result.url);
        setImagePath(result.path);
        Alert.alert('Success', 'Image uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageUrl("");
    setImagePath("");
  };

  const handleSubmit = async () => {
    if (!userProfileData) {
      Alert.alert("Error", "You must be logged in to create an article");
      return;
    }

    if (!title.trim() || !description.trim() || !content.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      const articleData: CreateArticleData = {
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        category,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
        readTime: parseInt(readTime) || 5,
        imageUrl: imageUrl.trim() || undefined,
        imagePath: imagePath.trim() || undefined,
        isPublished,
        isFeatured: false,
      };

      await createArticle(
        articleData,
        userProfileData.uid,
        userProfileData.displayName || userProfileData.firstName || 'Anonymous',
        userProfileData.photoURL || undefined
      );

      Alert.alert("Success", "Article created successfully!", [
        {
          text: "OK",
          onPress: () => router.push("/articles" as any),
        },
      ]);
    } catch (error) {
      console.error("Failed to create article:", error);
      Alert.alert("Error", "Failed to create article. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title to save as draft");
      return;
    }

    // Create a draft version (not published)
    const draftData: CreateArticleData = {
      title: title.trim(),
      description: description.trim() || "Draft article",
      content: content.trim() || "Content in progress...",
      category,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
      readTime: parseInt(readTime) || 5,
      imageUrl: imageUrl.trim() || undefined,
      imagePath: imagePath.trim() || undefined,
      isPublished: false,
      isFeatured: false,
    };

    try {
      setLoading(true);
      await createArticle(
        draftData,
        userProfileData!.uid,
        userProfileData!.displayName || userProfileData!.firstName || 'Anonymous',
        userProfileData!.photoURL || undefined
      );
      Alert.alert("Success", "Draft saved successfully!");
      router.back();
    } catch (error) {
      console.error("Failed to save draft:", error);
      Alert.alert("Error", "Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 py-4 border-b border-border bg-card">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-background"
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>

          <Text className="text-xl font-bold text-foreground">
            Write Article
          </Text>

          <TouchableOpacity
            onPress={handleSaveDraft}
            disabled={loading}
            className="px-4 py-2 bg-secondary rounded-lg"
          >
            <Text className="text-secondary-foreground font-medium">Draft</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
          {/* Title */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Title *
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter article title..."
              className="bg-card border border-border rounded-lg px-4 py-3 text-foreground text-lg"
              placeholderTextColor="#6B7280"
              multiline
            />
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Description *
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of your article..."
              className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Category */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row"
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`mr-2 px-4 py-2 rounded-lg border ${
                    category === cat
                      ? "bg-primary border-primary"
                      : "bg-card border-border"
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      category === cat ? "text-white" : "text-foreground"
                    }`}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tags */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Tags (comma separated)
            </Text>
            <TextInput
              value={tags}
              onChangeText={setTags}
              placeholder="anxiety, mindfulness, self-care..."
              className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
              placeholderTextColor="#6B7280"
            />
          </View>

          {/* Featured Image */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Featured Image
            </Text>
            
            {imageUrl ? (
              <View className="mb-4">
                <View className="relative">
                  <Image
                    source={{ uri: imageUrl }}
                    className="w-full h-48 rounded-lg"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={removeImage}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full items-center justify-center"
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="mb-4">
                <TouchableOpacity
                  onPress={handleImageUpload}
                  disabled={uploadingImage}
                  className="border-2 border-dashed border-border rounded-lg p-8 items-center justify-center bg-card"
                >
                  {uploadingImage ? (
                    <View className="items-center">
                      <ActivityIndicator size="large" color="#3B82F6" />
                      <Text className="text-muted-foreground mt-2">Uploading...</Text>
                    </View>
                  ) : (
                    <View className="items-center">
                      <Ionicons name="camera-outline" size={48} color="#6B7280" />
                      <Text className="text-foreground font-medium mt-2 mb-1">
                        Upload Image
                      </Text>
                      <Text className="text-muted-foreground text-sm text-center">
                        Tap to take a photo or choose from gallery
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}
            
            {/* Alternative: Image URL input */}
            <View className="mt-2">
              <Text className="text-xs text-muted-foreground mb-2">
                Or enter image URL:
              </Text>
              <View className="flex-row items-center">
                <TextInput
                  value={imageUrl}
                  onChangeText={(text) => {
                    setImageUrl(text);
                    if (text.trim()) {
                      setImagePath(""); // Clear path if URL is entered manually
                    }
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                  placeholderTextColor="#6B7280"
                  autoCapitalize="none"
                  keyboardType="url"
                />
                {imageUrl && (
                  <TouchableOpacity
                    onPress={() => {
                      setImageUrl("");
                      setImagePath("");
                    }}
                    className="ml-2 p-2"
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Read Time */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Estimated Read Time (minutes)
            </Text>
            <TextInput
              value={readTime}
              onChangeText={setReadTime}
              placeholder="5"
              className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
              style={{ width: 80 }}
            />
          </View>

          {/* Content */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Content *
            </Text>
            <TextInput
              value={content}
              onChangeText={handleContentChange}
              placeholder="Write your article content here..."
              className="bg-card border border-border rounded-lg px-4 py-3 text-foreground min-h-[200px]"
              placeholderTextColor="#6B7280"
              multiline
              textAlignVertical="top"
            />
            <Text className="text-xs text-muted-foreground mt-1">
              Word count:
              {content.split(/\s+/).filter((word) => word.length > 0).length}
            </Text>
          </View>

          {/* Publish Toggle */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between bg-card border border-border rounded-lg px-4 py-3">
              <View>
                <Text className="text-foreground font-semibold">
                  Publish immediately
                </Text>
                <Text className="text-muted-foreground text-sm">
                  Make article visible to all users
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsPublished(!isPublished)}
                className={`w-12 h-6 rounded-full ${
                  isPublished ? "bg-primary" : "bg-gray-300"
                } justify-center`}
              >
                <View
                  className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                    isPublished ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View className="px-6 py-4 border-t border-border bg-card">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={
              loading || !title.trim() || !description.trim() || !content.trim()
            }
            className={`w-full py-3 px-6 rounded-lg ${
              loading || !title.trim() || !description.trim() || !content.trim()
                ? "bg-gray-300 dark:bg-gray-600"
                : "bg-primary"
            }`}
          >
            <Text className="text-center font-semibold text-white">
              {loading
                ? "Publishing..."
                : isPublished
                  ? "Publish Article"
                  : "Save Draft"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
