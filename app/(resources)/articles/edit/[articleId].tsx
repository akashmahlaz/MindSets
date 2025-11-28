import { useAuth } from '@/context/AuthContext';
import {
    Article,
    CreateArticleData,
    getArticle,
    updateArticle
} from '@/services/articleService';
import ImageUploadService from '@/services/imageUploadService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

export default function EditStory() {
  const router = useRouter();
  const { articleId } = useLocalSearchParams();
  const { userProfile } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = getColors(isDark);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [article, setArticle] = useState<Article | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [readTime, setReadTime] = useState('5');
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  // Form validation
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (articleId && typeof articleId === 'string') {
      loadArticle(articleId);
    }
  }, [articleId]);

  const loadArticle = async (id: string) => {
    try {
      setLoading(true);
      const articleData = await getArticle(id);
      
      if (!articleData) {
        Alert.alert('Error', 'Article not found');
        router.back();
        return;
      }
      
      setArticle(articleData);
      
      // Check if user can edit this article
      if (articleData.authorId !== userProfile?.uid) {
        Alert.alert('Access Denied', 'You can only edit your own articles.');
        router.back();
        return;
      }
      
      // Populate form with article data
      setTitle(articleData.title);
      setDescription(articleData.description);
      setContent(articleData.content);
      setCategory(articleData.category);
      setTags(articleData.tags.join(', '));
      setImageUrl(articleData.imageUrl || '');
      setImagePath(articleData.imagePath || '');
      setReadTime(articleData.readTime.toString());
      setIsPublished(articleData.isPublished);
      setIsFeatured(articleData.isFeatured);
      
    } catch (error) {
      console.error('Failed to load article:', error);
      Alert.alert('Error', 'Failed to load article');
      router.back();
    } finally {
      setLoading(false);
    }
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

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) newErrors.title = "Title is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!content.trim()) newErrors.content = "Content is required";
    if (!category.trim()) newErrors.category = "Category is required";
    if (!readTime.trim() || isNaN(Number(readTime)))
      newErrors.readTime = "Valid read time is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm() || !article) return;

    setSaving(true);

    try {
      const updateData: Partial<CreateArticleData> = {
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        category: category.trim(),
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        readTime: parseInt(readTime),
        isPublished,
        isFeatured,
      };

      if (imageUrl.trim()) {
        updateData.imageUrl = imageUrl.trim();
      }

      await updateArticle(article.id, updateData);

      Alert.alert("Success", "Article updated successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error updating article:", error);
      Alert.alert("Error", "Failed to update article. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: colors.primarySoft,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16,
          }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Loading article...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.surface,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
          }}>
            <Ionicons name="document-text-outline" size={36} color={colors.textMuted} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
            Article not found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
              marginTop: 16,
            }}
          >
            <Text style={{ color: "#FFF", fontWeight: "600" }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text }}>
          Edit Story
        </Text>

        <TouchableOpacity
          onPress={handleUpdate}
          disabled={saving}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: saving ? colors.surfaceHover : colors.primary,
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFF" }}>Update</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Title *
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter story title"
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
              borderColor: errors.title ? colors.danger : colors.borderSubtle,
            }}
            multiline
          />
          {errors.title && <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>{errors.title}</Text>}
        </View>

        {/* Description */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Description *
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description of the article"
            placeholderTextColor={colors.textMuted}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
              color: colors.text,
              borderWidth: 1,
              borderColor: errors.description ? colors.danger : colors.borderSubtle,
              minHeight: 80,
            }}
            multiline
            textAlignVertical="top"
          />
          {errors.description && <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>{errors.description}</Text>}
        </View>

        {/* Category and Read Time */}
        <View style={{ flexDirection: "row", marginBottom: 24, gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Category *
            </Text>
            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="e.g., Mental Health"
              placeholderTextColor={colors.textMuted}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                color: colors.text,
                borderWidth: 1,
                borderColor: errors.category ? colors.danger : colors.borderSubtle,
              }}
            />
            {errors.category && <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>{errors.category}</Text>}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Read Time *
            </Text>
            <TextInput
              value={readTime}
              onChangeText={setReadTime}
              placeholder="5"
              keyboardType="numeric"
              placeholderTextColor={colors.textMuted}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                color: colors.text,
                borderWidth: 1,
                borderColor: errors.readTime ? colors.danger : colors.borderSubtle,
              }}
            />
            {errors.readTime && <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>{errors.readTime}</Text>}
          </View>
        </View>

        {/* Tags */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Tags
          </Text>
          <TextInput
            value={tags}
            onChangeText={setTags}
            placeholder="anxiety, depression, coping (comma separated)"
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
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>Separate tags with commas</Text>
        </View>

        {/* Image URL */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Featured Image URL
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
          ) : null}
          <TextInput
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://example.com/image.jpg"
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
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Content */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Content *
          </Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Write your article content here..."
            placeholderTextColor={colors.textMuted}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              color: colors.text,
              borderWidth: 1,
              borderColor: errors.content ? colors.danger : colors.borderSubtle,
              minHeight: 200,
              lineHeight: 24,
            }}
            multiline
            textAlignVertical="top"
          />
          {errors.content && <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>{errors.content}</Text>}
        </View>

        {/* Publishing Options */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Publishing Options
          </Text>

          <TouchableOpacity
            onPress={() => setIsPublished(!isPublished)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <View style={{
              width: 24,
              height: 24,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: isPublished ? colors.primary : colors.border,
              backgroundColor: isPublished ? colors.primary : "transparent",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 14,
            }}>
              {isPublished && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
            <Text style={{ fontSize: 15, color: colors.text, fontWeight: "500" }}>Publish article</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsFeatured(!isFeatured)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <View style={{
              width: 24,
              height: 24,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: isFeatured ? colors.primary : colors.border,
              backgroundColor: isFeatured ? colors.primary : "transparent",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 14,
            }}>
              {isFeatured && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
            <Text style={{ fontSize: 15, color: colors.text, fontWeight: "500" }}>Feature article</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
