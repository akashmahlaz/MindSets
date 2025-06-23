import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { ReviewService } from '@/services/reviewService';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ReviewSubmissionProps {
  counsellorId: string;
  counsellorName: string;
  onReviewSubmitted: () => void;
  onCancel: () => void;
  sessionId?: string;
}

export default function ReviewSubmission({
  counsellorId,
  counsellorName,
  onReviewSubmitted,
  onCancel,
  sessionId
}: ReviewSubmissionProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to submit a review');
      return;
    }

    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Comment Required', 'Please write at least 10 characters in your review');
      return;
    }

    try {
      setSubmitting(true);

      await ReviewService.submitReview(
        counsellorId,
        user.uid,
        user.displayName || 'Anonymous',
        rating,
        title.trim(),
        comment.trim(),
        sessionId,
        user.photoURL || undefined
      );

      Alert.alert(
        'Review Submitted',
        'Thank you for your feedback!',
        [{ text: 'OK', onPress: onReviewSubmitted }]
      );
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to submit review. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarSelector = () => {
    return (
      <View className="flex-row justify-center space-x-2 py-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            className="p-2"
          >
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={32}
              color={star <= rating ? "#F59E0B" : "#D1D5DB"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select Rating';
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={onCancel}>
          <Ionicons name="close" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-foreground">Write Review</Text>
        <View className="w-6" />
      </View>

      <View className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Review {counsellorName}</CardTitle>
            <Text className="text-muted-foreground">
              Share your experience to help others
            </Text>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Rating Section */}
            <View>
              <Text className="text-lg font-medium text-foreground mb-2">
                How would you rate your experience?
              </Text>
              {renderStarSelector()}
              <Text className="text-center text-foreground font-medium">
                {getRatingText(rating)}
              </Text>
            </View>

            {/* Title Section */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Review Title (Optional)
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Summarize your experience..."
                className="border border-border rounded-lg p-3 text-foreground bg-card"
                placeholderTextColor="#9CA3AF"
                maxLength={100}
              />
              <Text className="text-xs text-muted-foreground mt-1">
                {title.length}/100 characters
              </Text>
            </View>

            {/* Comment Section */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Your Review *
              </Text>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Tell others about your experience with this counsellor..."
                multiline
                numberOfLines={6}
                className="border border-border rounded-lg p-3 text-foreground bg-card"
                placeholderTextColor="#9CA3AF"
                maxLength={500}
                style={{ minHeight: 120, textAlignVertical: 'top' }}
              />
              <Text className="text-xs text-muted-foreground mt-1">
                {comment.length}/500 characters (minimum 10)
              </Text>
            </View>

            {/* Session Verification */}
            {sessionId && (
              <View className="bg-green-50 border border-green-200 rounded-lg p-3">
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                  <Text className="ml-2 text-green-700 font-medium">
                    Verified Session Review
                  </Text>
                </View>
                <Text className="text-green-600 text-sm mt-1">
                  This review is based on a completed therapy session
                </Text>
              </View>
            )}

            {/* Guidelines */}
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Text className="text-blue-700 font-medium text-sm mb-2">
                Review Guidelines:
              </Text>
              <Text className="text-blue-600 text-xs leading-4">
                • Be honest and constructive{'\n'}
                • Focus on your experience{'\n'}
                • Respect confidentiality{'\n'}
                • Avoid personal details{'\n'}
                • Help others make informed decisions
              </Text>
            </View>

            {/* Submit Button */}
            <View className="space-y-3 pt-4">
              <Button
                onPress={handleSubmit}
                disabled={submitting || rating === 0 || comment.trim().length < 10}
                className="w-full"
              >
                <Text className="text-primary-foreground font-medium">
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Text>
              </Button>

              <Button
                variant="outline"
                onPress={onCancel}
                className="w-full"
              >
                <Text className="text-foreground">Cancel</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}
