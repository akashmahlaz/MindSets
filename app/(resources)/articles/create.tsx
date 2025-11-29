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

// Dark theme colors matching the design
const getColors = (isDark: boolean) => ({
  background: isDark ? "#000000" : "#FFFFFF",
  surface: isDark ? "#1A1A1A" : "#F5F5F5",
  surfaceHover: isDark ? "#2A2A2A" : "#EBEBEB",
  surfaceActive: isDark ? "#333333" : "#E0E0E0",
  text: isDark ? "#FFFFFF" : "#000000",
  textSecondary: isDark ? "#999999" : "#666666",
  textMuted: isDark ? "#666666" : "#999999",
  border: isDark ? "#333333" : "#E0E0E0",
  borderSubtle: isDark ? "#222222" : "#F0F0F0",
  primary: "#FFFFFF",
  accent: "#2AA79D",
  danger: "#EF4444",
  success: "#2AA79D",
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
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Section */}
          <View style={{ marginBottom: 8, marginTop: 8 }}>
            <Text style={{ 
              fontSize: 28, 
              fontWeight: "700", 
              color: colors.text,
              letterSpacing: -0.5,
              marginBottom: 8,
            }}>
              Share Your Story
            </Text>
            <Text style={{ 
              fontSize: 16, 
              color: colors.textSecondary,
              lineHeight: 22,
            }}>
              Share your experience to help and inspire others in their journey
            </Text>
          </View>

          {/* Story Card Preview */}
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 16,
            marginTop: 24,
            marginBottom: 20,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View style={{
                backgroundColor: colors.surfaceHover,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
              }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  {Math.ceil(content.length / 1000) || 1} min read
                </Text>
              </View>
            </View>
            
            {/* Image Preview or Upload */}
            {imageUrl ? (
              <View style={{ position: "relative", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: "100%", height: 160 }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={removeImage}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="close" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleImageUpload}
                disabled={uploadingImage}
                style={{
                  backgroundColor: colors.surfaceHover,
                  borderRadius: 16,
                  height: 120,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <>
                    <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                    <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 8 }}>
                      Add cover image
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Title Preview */}
            <Text style={{
              fontSize: 22,
              fontWeight: "700",
              color: title ? colors.text : colors.textMuted,
              marginBottom: 4,
            }}>
              {title || "Your story title"}
            </Text>
          </View>

          {/* Form Steps */}
          <View style={{ gap: 0 }}>
            {/* Step 1: Title */}
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 18,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderSubtle,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "500", color: colors.text, marginBottom: 4 }}>
                  Title
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Give your story a title..."
                  placeholderTextColor={colors.textMuted}
                  style={{
                    fontSize: 15,
                    color: colors.text,
                    padding: 0,
                  }}
                />
              </View>
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: title.trim() ? colors.success : colors.border,
                backgroundColor: title.trim() ? colors.success : "transparent",
                justifyContent: "center",
                alignItems: "center",
              }}>
                {title.trim() && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
            </TouchableOpacity>

            {/* Step 2: Description */}
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 18,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderSubtle,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "500", color: colors.text, marginBottom: 4 }}>
                  Brief description
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What's your story about?..."
                  placeholderTextColor={colors.textMuted}
                  style={{
                    fontSize: 15,
                    color: colors.text,
                    padding: 0,
                  }}
                  multiline
                />
              </View>
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: description.trim() ? colors.success : colors.border,
                backgroundColor: description.trim() ? colors.success : "transparent",
                justifyContent: "center",
                alignItems: "center",
              }}>
                {description.trim() && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
            </TouchableOpacity>

            {/* Step 3: Content */}
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
                paddingVertical: 18,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderSubtle,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "500", color: colors.text, marginBottom: 4 }}>
                  Your story
                </Text>
                <TextInput
                  value={content}
                  onChangeText={handleContentChange}
                  placeholder="Share your experience, thoughts, or journey..."
                  placeholderTextColor={colors.textMuted}
                  style={{
                    fontSize: 15,
                    color: colors.text,
                    padding: 0,
                    minHeight: 100,
                  }}
                  multiline
                  textAlignVertical="top"
                />
                {content.length > 0 && (
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 8 }}>
                    {content.split(/\s+/).filter((w) => w.length > 0).length} words
                  </Text>
                )}
              </View>
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: content.trim().length > 50 ? colors.success : colors.border,
                backgroundColor: content.trim().length > 50 ? colors.success : "transparent",
                justifyContent: "center",
                alignItems: "center",
                marginTop: 4,
              }}>
                {content.trim().length > 50 && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
            </TouchableOpacity>

            {/* Step 4: Category */}
            <View style={{
              paddingVertical: 18,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderSubtle,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: "500", color: colors.text }}>
                  Category
                </Text>
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: colors.success,
                  backgroundColor: colors.success,
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 16,
                        backgroundColor: category === cat ? colors.text : colors.surface,
                      }}
                    >
                      <Text style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: category === cat ? colors.background : colors.text,
                      }}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Step 5: Tags (Optional) */}
            <View style={{
              paddingVertical: 18,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: "500", color: colors.text }}>
                  Tags (optional)
                </Text>
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: colors.border,
                  justifyContent: "center",
                  alignItems: "center",
                }} />
              </View>
              <TextInput
                value={tags}
                onChangeText={setTags}
                placeholder="anxiety, mindfulness, self-care..."
                placeholderTextColor={colors.textMuted}
                style={{
                  fontSize: 15,
                  color: colors.text,
                  padding: 0,
                }}
              />
            </View>
          </View>
        </ScrollView>

        {/* Bottom Button - Like the design */}
        <View style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingVertical: 20,
          paddingBottom: Platform.OS === "ios" ? 34 : 20,
          backgroundColor: colors.background,
        }}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || !title.trim() || !description.trim() || !content.trim()}
            style={{
              backgroundColor: (loading || !title.trim() || !description.trim() || !content.trim()) 
                ? colors.surfaceHover 
                : colors.text,
              paddingVertical: 18,
              borderRadius: 30,
              alignItems: "center",
            }}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={{
                fontSize: 17,
                fontWeight: "600",
                color: (loading || !title.trim() || !description.trim() || !content.trim()) 
                  ? colors.textMuted 
                  : colors.background,
              }}>
                Publish
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
