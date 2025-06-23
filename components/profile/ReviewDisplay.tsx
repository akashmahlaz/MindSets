import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Review, ReviewService, ReviewStats } from '@/services/reviewService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ReviewDisplayProps {
  counsellorId: string;
  onWriteReview: () => void;
  showWriteReviewButton?: boolean;
}

export default function ReviewDisplay({ 
  counsellorId, 
  onWriteReview,
  showWriteReviewButton = true 
}: ReviewDisplayProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState<Review | null>(null);

  useEffect(() => {
    loadReviews();
    if (user) {
      checkUserReview();
    }
  }, [counsellorId, user]);

  const loadReviews = async () => {
    try {
      const [reviewsData, statsData] = await Promise.all([
        ReviewService.getCounsellorReviews(counsellorId, 10),
        ReviewService.getCounsellorReviewStats(counsellorId)
      ]);
      
      setReviews(reviewsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserReview = async () => {
    if (!user) return;
    
    try {
      const existingReview = await ReviewService.getUserReviewForCounsellor(user.uid, counsellorId);
      setUserReview(existingReview);
    } catch (error) {
      console.error('Error checking user review:', error);
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={size}
            color="#F59E0B"
          />
        ))}
      </View>
    );
  };

  const renderRatingDistribution = () => {
    if (!stats) return null;

    return (
      <View className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] || 0;
          const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
          
          return (
            <View key={rating} className="flex-row items-center space-x-2">
              <Text className="text-sm text-muted-foreground w-2">{rating}</Text>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <View className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <View 
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </View>
              <Text className="text-xs text-muted-foreground w-8">{count}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <Text className="text-muted-foreground">Loading reviews...</Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <View className="flex-row items-center justify-between">
          <CardTitle>Reviews</CardTitle>
          {showWriteReviewButton && !userReview && (
            <Button onPress={onWriteReview} size="sm">
              <Text className="text-primary-foreground">Write Review</Text>
            </Button>
          )}
        </View>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Rating Summary */}
        {stats && stats.totalReviews > 0 ? (
          <View className="space-y-4">
            <View className="flex-row items-center space-x-4">
              <View className="items-center">
                <Text className="text-3xl font-bold text-foreground">
                  {stats.averageRating.toFixed(1)}
                </Text>
                {renderStars(Math.round(stats.averageRating), 20)}
                <Text className="text-sm text-muted-foreground mt-1">
                  {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                </Text>
              </View>
              
              <View className="flex-1">
                {renderRatingDistribution()}
              </View>
            </View>

            {/* User's Review */}
            {userReview && (
              <View className="border-l-4 border-primary pl-4 bg-primary/5 p-3 rounded-r-lg">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-medium text-foreground">Your Review</Text>
                  {renderStars(userReview.rating)}
                </View>
                <Text className="text-sm font-medium text-foreground mb-1">
                  {userReview.title}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {userReview.comment}
                </Text>
              </View>
            )}

            {/* Recent Reviews */}
            <View className="space-y-3">
              <Text className="font-medium text-foreground">Recent Reviews</Text>
              {reviews.slice(0, 3).map((review) => (
                <View key={review.id} className="border-b border-border pb-3 last:border-b-0">
                  <View className="flex-row items-start space-x-3">
                    <Avatar className="w-8 h-8" alt={review.userName}>
                      {review.userPhoto ? (
                        <AvatarImage source={{ uri: review.userPhoto }} />
                      ) : (
                        <AvatarFallback className="bg-primary/10">
                          <Text className="text-primary text-xs">
                            {review.userName.charAt(0).toUpperCase()}
                          </Text>
                        </AvatarFallback>
                      )}
                    </Avatar>
                    
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="font-medium text-foreground text-sm">
                          {review.userName}
                        </Text>
                        {renderStars(review.rating, 14)}
                      </View>
                      
                      {review.title && (
                        <Text className="text-sm font-medium text-foreground mb-1">
                          {review.title}
                        </Text>
                      )}
                      
                      <Text className="text-sm text-muted-foreground">
                        {review.comment}
                      </Text>
                      
                      <Text className="text-xs text-muted-foreground mt-1">
                        {review.createdAt.toLocaleDateString()}
                        {review.isVerified && (
                          <Text className="text-green-600 ml-2">• Verified</Text>
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
              
              {reviews.length > 3 && (
                <TouchableOpacity className="pt-2">
                  <Text className="text-primary text-sm font-medium text-center">
                    View All {stats.totalReviews} Reviews
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View className="text-center py-8">
            <Ionicons name="star-outline" size={48} color="#9CA3AF" />
            <Text className="text-foreground text-lg font-medium mt-2">
              No Reviews Yet
            </Text>
            <Text className="text-muted-foreground text-sm">
              Be the first to review this counsellor
            </Text>
            {showWriteReviewButton && (
              <Button onPress={onWriteReview} className="mt-4">
                <Text className="text-primary-foreground">Write First Review</Text>
              </Button>
            )}
          </View>
        )}
      </CardContent>
    </Card>
  );
}
