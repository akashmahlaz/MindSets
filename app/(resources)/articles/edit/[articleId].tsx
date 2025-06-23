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
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditArticle() {
  const router = useRouter();
  const { articleId } = useLocalSearchParams();
  const { userProfile } = useAuth();
  
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
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-muted-foreground mt-4">Loading article...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
          <Text className="text-xl font-semibold text-foreground mt-4 mb-2">
            Article not found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-primary px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 py-4 border-b border-border bg-card">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <Text className="text-lg font-semibold text-foreground">
            Edit Article
          </Text>

          <TouchableOpacity
            onPress={handleUpdate}
            disabled={saving}
            className={`px-4 py-2 rounded-lg ${saving ? "bg-gray-300" : "bg-primary"}`}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-medium">Update</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Title */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-foreground mb-2">
            Title *
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter article title"
            className="border border-border rounded-lg px-4 py-3 text-foreground bg-card"
            multiline
          />
          {errors.title && (
            <Text className="text-red-500 text-sm mt-1">{errors.title}</Text>
          )}
        </View>

        {/* Description */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-foreground mb-2">
            Description *
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description of the article"
            className="border border-border rounded-lg px-4 py-3 text-foreground bg-card"
            multiline
            numberOfLines={3}
          />
          {errors.description && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.description}
            </Text>
          )}
        </View>

        {/* Category and Read Time */}
        <View className="flex-row mb-6">
          <View className="flex-1 mr-3">
            <Text className="text-base font-semibold text-foreground mb-2">
              Category *
            </Text>
            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="e.g., Mental Health"
              className="border border-border rounded-lg px-4 py-3 text-foreground bg-card"
            />
            {errors.category && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.category}
              </Text>
            )}
          </View>

          <View className="flex-1 ml-3">
            <Text className="text-base font-semibold text-foreground mb-2">
              Read Time (min) *
            </Text>
            <TextInput
              value={readTime}
              onChangeText={setReadTime}
              placeholder="5"
              keyboardType="numeric"
              className="border border-border rounded-lg px-4 py-3 text-foreground bg-card"
            />
            {errors.readTime && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.readTime}
              </Text>
            )}
          </View>
        </View>

        {/* Tags */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-foreground mb-2">
            Tags
          </Text>
          <TextInput
            value={tags}
            onChangeText={setTags}
            placeholder="anxiety, depression, coping (comma separated)"
            className="border border-border rounded-lg px-4 py-3 text-foreground bg-card"
          />
          <Text className="text-sm text-muted-foreground mt-1">
            Separate tags with commas
          </Text>
        </View>

        {/* Image URL */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-foreground mb-2">
            Featured Image URL
          </Text>
          <TextInput
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://example.com/image.jpg"
            className="border border-border rounded-lg px-4 py-3 text-foreground bg-card"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Content */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-foreground mb-2">
            Content *
          </Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Write your article content here..."
            className="border border-border rounded-lg px-4 py-3 text-foreground bg-card"
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />
          {errors.content && (
            <Text className="text-red-500 text-sm mt-1">{errors.content}</Text>
          )}
        </View>

        {/* Publishing Options */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-foreground mb-4">
            Publishing Options
          </Text>

          <TouchableOpacity
            onPress={() => setIsPublished(!isPublished)}
            className="flex-row items-center mb-3"
          >
            <View
              className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                isPublished ? "bg-primary border-primary" : "border-border"
              }`}
            >
              {isPublished && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <Text className="text-foreground">Publish article</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsFeatured(!isFeatured)}
            className="flex-row items-center"
          >
            <View
              className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                isFeatured ? "bg-primary border-primary" : "border-border"
              }`}
            >
              {isFeatured && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <Text className="text-foreground">Feature article</Text>
          </TouchableOpacity>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
