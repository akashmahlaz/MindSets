import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export interface Review {
  id: string;
  counsellorId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number; // 1-5 stars
  title: string;
  comment: string;
  sessionId?: string; // Reference to completed session
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean; // True if from completed session
  helpfulCount: number;
  reportCount: number;
  isVisible: boolean; // For moderation
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

const REVIEWS_COLLECTION = "reviews";
const COUNSELLOR_STATS_COLLECTION = "counsellorStats";

export class ReviewService {
  /**
   * Submit a review for a counsellor
   */
  static async submitReview(
    counsellorId: string,
    userId: string,
    userName: string,
    rating: number,
    title: string,
    comment: string,
    sessionId?: string,
    userPhoto?: string,
  ): Promise<string> {
    try {
      // Check if user already reviewed this counsellor
      const existingReview = await this.getUserReviewForCounsellor(
        userId,
        counsellorId,
      );
      if (existingReview) {
        throw new Error("You have already reviewed this counsellor");
      }

      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      const now = new Date();
      const reviewData = {
        counsellorId,
        userId,
        userName,
        userPhoto: userPhoto || "",
        rating,
        title: title.trim(),
        comment: comment.trim(),
        sessionId: sessionId || "",
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        isVerified: !!sessionId, // Verified if from completed session
        helpfulCount: 0,
        reportCount: 0,
        isVisible: true,
      };

      const docRef = await addDoc(
        collection(db, REVIEWS_COLLECTION),
        reviewData,
      );

      // Update counsellor's rating stats
      await this.updateCounsellorRatingStats(counsellorId);

      return docRef.id;
    } catch (error) {
      console.error("Error submitting review:", error);
      throw error;
    }
  }

  /**
   * Get reviews for a counsellor
   */
  static async getCounsellorReviews(
    counsellorId: string,
    limit: number = 10,
  ): Promise<Review[]> {
    try {
      const q = query(
        collection(db, REVIEWS_COLLECTION),
        where("counsellorId", "==", counsellorId),
        where("isVisible", "==", true),
        orderBy("createdAt", "desc"),
      );

      const querySnapshot = await getDocs(q);
      const reviews: Review[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          counsellorId: data.counsellorId,
          userId: data.userId,
          userName: data.userName,
          userPhoto: data.userPhoto,
          rating: data.rating,
          title: data.title,
          comment: data.comment,
          sessionId: data.sessionId,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          isVerified: data.isVerified,
          helpfulCount: data.helpfulCount || 0,
          reportCount: data.reportCount || 0,
          isVisible: data.isVisible,
        });
      });

      return reviews.slice(0, limit);
    } catch (error) {
      console.error("Error getting counsellor reviews:", error);
      return [];
    }
  }

  /**
   * Get review statistics for a counsellor
   */
  static async getCounsellorReviewStats(
    counsellorId: string,
  ): Promise<ReviewStats> {
    try {
      const statsDoc = await getDoc(
        doc(db, COUNSELLOR_STATS_COLLECTION, counsellorId),
      );

      if (statsDoc.exists()) {
        const data = statsDoc.data();
        return {
          averageRating: data.averageRating || 0,
          totalReviews: data.totalReviews || 0,
          ratingDistribution: data.ratingDistribution || {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          },
        };
      } else {
        // If no stats exist, calculate them
        return await this.calculateAndUpdateStats(counsellorId);
      }
    } catch (error) {
      console.error("Error getting counsellor review stats:", error);
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }
  }

  /**
   * Check if user has already reviewed a counsellor
   */
  static async getUserReviewForCounsellor(
    userId: string,
    counsellorId: string,
  ): Promise<Review | null> {
    try {
      const q = query(
        collection(db, REVIEWS_COLLECTION),
        where("userId", "==", userId),
        where("counsellorId", "==", counsellorId),
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          counsellorId: data.counsellorId,
          userId: data.userId,
          userName: data.userName,
          userPhoto: data.userPhoto,
          rating: data.rating,
          title: data.title,
          comment: data.comment,
          sessionId: data.sessionId,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          isVerified: data.isVerified,
          helpfulCount: data.helpfulCount || 0,
          reportCount: data.reportCount || 0,
          isVisible: data.isVisible,
        };
      }

      return null;
    } catch (error) {
      console.error("Error checking user review:", error);
      return null;
    }
  }

  /**
   * Update counsellor rating statistics
   */
  static async updateCounsellorRatingStats(
    counsellorId: string,
  ): Promise<void> {
    try {
      await this.calculateAndUpdateStats(counsellorId);
    } catch (error) {
      console.error("Error updating counsellor rating stats:", error);
    }
  }

  /**
   * Calculate and update counsellor statistics
   */
  private static async calculateAndUpdateStats(
    counsellorId: string,
  ): Promise<ReviewStats> {
    try {
      const q = query(
        collection(db, REVIEWS_COLLECTION),
        where("counsellorId", "==", counsellorId),
        where("isVisible", "==", true),
      );

      const querySnapshot = await getDocs(q);
      const reviews: number[] = [];
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      querySnapshot.forEach((doc) => {
        const rating = doc.data().rating;
        reviews.push(rating);
        ratingDistribution[rating as keyof typeof ratingDistribution]++;
      });

      const totalReviews = reviews.length;
      const averageRating =
        totalReviews > 0
          ? reviews.reduce((sum, rating) => sum + rating, 0) / totalReviews
          : 0;

      const stats: ReviewStats = {
        averageRating,
        totalReviews,
        ratingDistribution,
      };

      // Update counsellor stats document
      await setDoc(doc(db, COUNSELLOR_STATS_COLLECTION, counsellorId), {
        averageRating,
        totalReviews,
        ratingDistribution,
        updatedAt: Timestamp.fromDate(new Date()),
      });

      return stats;
    } catch (error) {
      console.error("Error calculating stats:", error);
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }
  }

  /**
   * Delete a review
   */
  static async deleteReview(
    reviewId: string,
    counsellorId: string,
  ): Promise<void> {
    try {
      await deleteDoc(doc(db, REVIEWS_COLLECTION, reviewId));
      await this.updateCounsellorRatingStats(counsellorId);
    } catch (error) {
      console.error("Error deleting review:", error);
      throw error;
    }
  }

  /**
   * Update a review
   */
  static async updateReview(
    reviewId: string,
    counsellorId: string,
    rating: number,
    title: string,
    comment: string,
  ): Promise<void> {
    try {
      await updateDoc(doc(db, REVIEWS_COLLECTION, reviewId), {
        rating,
        title: title.trim(),
        comment: comment.trim(),
        updatedAt: Timestamp.fromDate(new Date()),
      });

      await this.updateCounsellorRatingStats(counsellorId);
    } catch (error) {
      console.error("Error updating review:", error);
      throw error;
    }
  }
}
