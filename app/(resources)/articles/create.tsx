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
    useColorScheme,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Perplexity-inspired color tokens
const getColors = (isDark: boolean) => ({
  background: isDark ? "#0D0D0D" : "#FFFFFF",
  surface: isDark ? "#171717" : "#F9FAFB",
  surfaceHover: isDark ? "#1F1F1F" : "#F3F4F6",
  text: isDark ? "#FAFAFA" : "#111827",
  textSecondary: isDark ? "#A3A3A3" : "#6B7280",
  textMuted: isDark ? "#737373" : "#9CA3AF",
  border: isDark ? "#262626" : "#E5E7EB",
  borderSubtle: isDark ? "#1F1F1F" : "#F3F4F6",
  primary: "#6366F1",
  primarySoft: isDark ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.08)",
  danger: "#EF4444",
  success: "#10B981",
});

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

export default function CreateStory() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = getColors(isDark);
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
      Alert.alert("Error", "You must be logged in to create a story");
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

      Alert.alert("Success", "Story published successfully!", [
        {
          text: "OK",
          onPress: () => router.push("/articles" as any),
        },
      ]);
    } catch (error) {
      console.error("Failed to create story:", error);
      Alert.alert("Error", "Failed to create story. Please try again.");
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      {/* Header */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: colors.surface,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text }}>
          Write Story
        </Text>

        <TouchableOpacity
          onPress={handleSaveDraft}
          disabled={loading}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: colors.surface,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>
            Draft
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ 
              fontSize: 13, 
              fontWeight: "600", 
              color: colors.textMuted, 
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}>
              Title *
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter story title..."
              placeholderTextColor={colors.textMuted}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 17,
                fontWeight: "600",
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
              multiline
            />
          </View>

          {/* Description */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ 
              fontSize: 13, 
              fontWeight: "600", 
              color: colors.textMuted, 
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}>
              Description *
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of your story..."
              placeholderTextColor={colors.textMuted}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                minHeight: 80,
              }}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Category */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ 
              fontSize: 13, 
              fontWeight: "600", 
              color: colors.textMuted, 
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}>
              Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: category === cat ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: category === cat ? colors.primary : colors.borderSubtle,
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: category === cat ? "#FFF" : colors.text,
                  }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tags */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ 
              fontSize: 13, 
              fontWeight: "600", 
              color: colors.textMuted, 
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}>
              Tags (comma separated)
            </Text>
            <TextInput
              value={tags}
              onChangeText={setTags}
              placeholder="anxiety, mindfulness, self-care..."
              placeholderTextColor={colors.textMuted}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            />
          </View>

          {/* Featured Image */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ 
              fontSize: 13, 
              fontWeight: "600", 
              color: colors.textMuted, 
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}>
              Featured Image
            </Text>
            
            {imageUrl ? (
              <View style={{ marginBottom: 12 }}>
                <View style={{ position: "relative", borderRadius: 16, overflow: "hidden" }}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={{ width: "100%", height: 180 }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={removeImage}
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: colors.danger,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="close" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleImageUpload}
                disabled={uploadingImage}
                style={{
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: colors.border,
                  borderRadius: 16,
                  padding: 32,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.surface,
                }}
              >
                {uploadingImage ? (
                  <View style={{ alignItems: "center" }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>
                      Uploading...
                    </Text>
                  </View>
                ) : (
                  <View style={{ alignItems: "center" }}>
                    <View style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: colors.primarySoft,
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 12,
                    }}>
                      <Ionicons name="camera-outline" size={28} color={colors.primary} />
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text, marginBottom: 4 }}>
                      Upload Image
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center" }}>
                      Tap to take a photo or choose from gallery
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            
            {/* Alternative: Image URL input */}
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>
                Or enter image URL:
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TextInput
                  value={imageUrl}
                  onChangeText={(text) => {
                    setImageUrl(text);
                    if (text.trim()) {
                      setImagePath("");
                    }
                  }}
                  placeholder="https://example.com/image.jpg"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 14,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                  }}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                {imageUrl && (
                  <TouchableOpacity
                    onPress={() => {
                      setImageUrl("");
                      setImagePath("");
                    }}
                    style={{ marginLeft: 8, padding: 8 }}
                  >
                    <Ionicons name="close-circle" size={22} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Read Time */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ 
              fontSize: 13, 
              fontWeight: "600", 
              color: colors.textMuted, 
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}>
              Estimated Read Time (minutes)
            </Text>
            <TextInput
              value={readTime}
              onChangeText={setReadTime}
              placeholder="5"
              placeholderTextColor={colors.textMuted}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                width: 100,
              }}
              keyboardType="numeric"
            />
          </View>

          {/* Content */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ 
              fontSize: 13, 
              fontWeight: "600", 
              color: colors.textMuted, 
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}>
              Content *
            </Text>
            <TextInput
              value={content}
              onChangeText={handleContentChange}
              placeholder="Write your story here..."
              placeholderTextColor={colors.textMuted}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                minHeight: 200,
                lineHeight: 24,
              }}
              multiline
              textAlignVertical="top"
            />
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 8 }}>
              Word count: {content.split(/\s+/).filter((word) => word.length > 0).length}
            </Text>
          </View>

          {/* Publish Toggle */}
          <View style={{ marginBottom: 32 }}>
            <TouchableOpacity
              onPress={() => setIsPublished(!isPublished)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: colors.surface,
                borderRadius: 14,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <View>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
                  Publish immediately
                </Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                  Make story visible to all users
                </Text>
              </View>
              <View style={{
                width: 52,
                height: 28,
                borderRadius: 14,
                backgroundColor: isPublished ? colors.success : colors.surfaceHover,
                justifyContent: "center",
                padding: 2,
              }}>
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: "#FFF",
                  transform: [{ translateX: isPublished ? 24 : 0 }],
                  ...Platform.select({
                    ios: {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.2,
                      shadowRadius: 2,
                    },
                    android: { elevation: 2 },
                  }),
                }} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Submit Button */}
        <View style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
          backgroundColor: colors.background,
        }}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || !title.trim() || !description.trim() || !content.trim()}
            style={{
              backgroundColor: (loading || !title.trim() || !description.trim() || !content.trim()) 
                ? colors.surfaceHover 
                : colors.primary,
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={{
                fontSize: 16,
                fontWeight: "600",
                color: (loading || !title.trim() || !description.trim() || !content.trim()) 
                  ? colors.textMuted 
                  : "#FFF",
              }}>
                {isPublished ? "Publish Story" : "Save Draft"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
