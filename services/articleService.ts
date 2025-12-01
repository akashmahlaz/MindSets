import { db } from "@/firebaseConfig";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";

export interface Article {
  id: string;
  title: string;
  content: string;
  description: string;
  imageUrl?: string;
  imagePath?: string; // Firebase Storage path for image deletion
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  category: string;
  tags: string[];
  readTime: number; // in minutes
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  viewCount: number;
}

export interface CreateArticleData {
  title: string;
  content: string;
  description: string;
  imageUrl?: string;
  imagePath?: string; // Firebase Storage path for image deletion
  category: string;
  tags: string[];
  readTime: number;
  isPublished?: boolean;
  isFeatured?: boolean;
}

const ARTICLES_COLLECTION = "articles";

// Get all articles with optional filters
export const getArticles = async (options?: {
  limit?: number;
  category?: string;
  featured?: boolean;
  published?: boolean;
}): Promise<Article[]> => {
  try {
    // Build query constraints array
    const constraints = [];
    
    // Add where clauses first
    if (options?.published !== undefined) {
      constraints.push(where("isPublished", "==", options.published));
    }
    
    if (options?.featured) {
      constraints.push(where("isFeatured", "==", true));
    }
    
    if (options?.category) {
      constraints.push(where("category", "==", options.category));
    }
    
    // Add orderBy
    constraints.push(orderBy("createdAt", "desc"));
    
    // Add limit if specified
    if (options?.limit) {
      constraints.push(limit(options.limit));
    }

    const articlesQuery = query(
      collection(db, ARTICLES_COLLECTION),
      ...constraints
    );

    const querySnapshot = await getDocs(articlesQuery);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Article[];
  } catch (error) {
    console.error("Error fetching articles:", error);
    throw error;
  }
};

// Get featured articles for dashboard
export const getFeaturedArticles = async (
  limitCount: number = 2,
): Promise<Article[]> => {
  try {
    // First try to get featured articles
    try {
      const featuredArticles = await getArticles({
        featured: true,
        published: true,
        limit: limitCount,
      });
      
      if (featuredArticles.length > 0) {
        console.log("Found featured articles:", featuredArticles.length);
        return featuredArticles;
      }
    } catch (indexError) {
      console.log("Composite index not ready, using fallback...");
    }
    
    // Fallback: If no featured articles, get recent published articles
    console.log("No featured articles found, getting recent articles...");
    const recentArticles = await getArticles({
      published: true,
      limit: limitCount,
    });
    
    console.log("Found recent articles:", recentArticles.length);
    return recentArticles;
  } catch (error) {
    console.error("Error fetching featured articles:", error);
    // Final fallback: return empty array to prevent UI crash
    return [];
  }
};

// Get single article by ID
export const getArticle = async (
  articleId: string,
): Promise<Article | null> => {
  try {
    const articleDoc = await getDoc(doc(db, ARTICLES_COLLECTION, articleId));

    if (!articleDoc.exists()) {
      return null;
    }

    // Increment view count
    await updateDoc(doc(db, ARTICLES_COLLECTION, articleId), {
      viewCount: (articleDoc.data().viewCount || 0) + 1,
    });

    return {
      id: articleDoc.id,
      ...articleDoc.data(),
    } as Article;
  } catch (error) {
    console.error("Error fetching article:", error);
    throw error;
  }
};

// Create new article
export const createArticle = async (
  articleData: CreateArticleData,
  authorId: string,
  authorName: string,
  authorPhotoURL?: string,
): Promise<string> => {
  try {
    const article = {
      ...articleData,
      authorId,
      authorName,
      authorPhotoURL: authorPhotoURL || "",
      isPublished: articleData.isPublished ?? false,
      isFeatured: articleData.isFeatured ?? false,
      viewCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, ARTICLES_COLLECTION), article);
    return docRef.id;
  } catch (error) {
    console.error("Error creating article:", error);
    throw error;
  }
};

// Update article
export const updateArticle = async (
  articleId: string,
  updates: Partial<CreateArticleData>,
): Promise<void> => {
  try {
    await updateDoc(doc(db, ARTICLES_COLLECTION, articleId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating article:", error);
    throw error;
  }
};

// Delete article
export const deleteArticle = async (articleId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, ARTICLES_COLLECTION, articleId));
  } catch (error) {
    console.error("Error deleting article:", error);
    throw error;
  }
};

// Get articles by author
export const getArticlesByAuthor = async (
  authorId: string,
  publishedOnly: boolean = true, // If true, only published articles; if false, all articles (published + unpublished)
): Promise<Article[]> => {
  try {
    const constraints = [
      where("authorId", "==", authorId),
      orderBy("createdAt", "desc")
    ];
    
    // Only filter by published status if we want published-only
    if (publishedOnly) {
      constraints.unshift(where("isPublished", "==", true));
    }

    const articlesQuery = query(
      collection(db, ARTICLES_COLLECTION),
      ...constraints
    );

    const querySnapshot = await getDocs(articlesQuery);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Article[];
  } catch (error) {
    console.error("Error fetching articles by author:", error);
    throw error;
  }
};

// Search articles
export const searchArticles = async (
  searchTerm: string,
): Promise<Article[]> => {
  try {
    // Note: Firestore doesn't support full-text search natively
    // This is a simple implementation that searches in title and description
    // For production, consider using Algolia or similar service
    const articles = await getArticles({ published: true });

    const searchLower = searchTerm.toLowerCase();
    return articles.filter(
      (article) =>
        article.title.toLowerCase().includes(searchLower) ||
        article.description.toLowerCase().includes(searchLower) ||
        article.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
    );
  } catch (error) {
    console.error("Error searching articles:", error);
    throw error;
  }
};

// Get categories
export const getCategories = async (): Promise<string[]> => {
  try {
    const articles = await getArticles({ published: true });
    const categories = [
      ...new Set(articles.map((article) => article.category)),
    ];
    return categories.sort();
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

// Get all published articles
export const getAllArticles = async (): Promise<Article[]> => {
  return getArticles({ published: true });
};

// Get articles by a specific user
export const getUserArticles = async (userId: string): Promise<Article[]> => {
  return getArticlesByAuthor(userId, false); // Include both published and unpublished for user's own articles
};

// Increment view count for an article
export const incrementArticleViews = async (
  articleId: string,
): Promise<void> => {
  try {
    const articleRef = doc(db, ARTICLES_COLLECTION, articleId);
    const articleSnap = await getDoc(articleRef);

    if (articleSnap.exists()) {
      const currentViews = articleSnap.data().viewCount || 0;
      await updateDoc(articleRef, {
        viewCount: currentViews + 1,
      });
    }
  } catch (error) {
    console.error("Error incrementing article views:", error);
    // Don't throw error for view counting as it's not critical
  }
};
