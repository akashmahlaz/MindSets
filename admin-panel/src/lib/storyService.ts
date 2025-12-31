import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    Timestamp,
    updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Story {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  readTime: number;
  imageUrl?: string;
  imagePath?: string;
  isPublished: boolean;
  isFeatured: boolean;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  viewCount: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const STORY_CATEGORIES = [
  "Mental Health",
  "Anxiety",
  "Depression",
  "Stress",
  "Relationships",
  "Self-Care",
  "Mindfulness",
  "Wellness",
  "Personal Growth",
  "Other",
];

// Fetch all stories
export const fetchStories = async (): Promise<Story[]> => {
  try {
    const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Story[];
  } catch (error) {
    console.error("Error fetching stories:", error);
    throw error;
  }
};

// Fetch single story
export const fetchStory = async (storyId: string): Promise<Story | null> => {
  try {
    const docRef = doc(db, "articles", storyId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Story;
    }
    return null;
  } catch (error) {
    console.error("Error fetching story:", error);
    throw error;
  }
};

// Create story
export const createStory = async (
  data: Omit<Story, "id" | "createdAt" | "updatedAt" | "viewCount">
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "articles"), {
      ...data,
      viewCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating story:", error);
    throw error;
  }
};

// Update story
export const updateStory = async (
  storyId: string,
  data: Partial<Story>
): Promise<void> => {
  try {
    const docRef = doc(db, "articles", storyId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating story:", error);
    throw error;
  }
};

// Toggle publish status
export const toggleStoryPublish = async (
  storyId: string,
  isPublished: boolean
): Promise<void> => {
  try {
    const docRef = doc(db, "articles", storyId);
    await updateDoc(docRef, {
      isPublished,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error toggling story publish status:", error);
    throw error;
  }
};

// Toggle featured status
export const toggleStoryFeatured = async (
  storyId: string,
  isFeatured: boolean
): Promise<void> => {
  try {
    const docRef = doc(db, "articles", storyId);
    await updateDoc(docRef, {
      isFeatured,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error toggling story featured status:", error);
    throw error;
  }
};

// Delete story
export const deleteStory = async (storyId: string): Promise<void> => {
  try {
    const docRef = doc(db, "articles", storyId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting story:", error);
    throw error;
  }
};

// Get story stats
export const getStoryStats = async () => {
  try {
    const snapshot = await getDocs(collection(db, "articles"));
    const stories = snapshot.docs.map((doc) => doc.data());
    
    return {
      total: stories.length,
      published: stories.filter((s) => s.isPublished).length,
      drafts: stories.filter((s) => !s.isPublished).length,
      featured: stories.filter((s) => s.isFeatured).length,
      totalViews: stories.reduce((acc, s) => acc + (s.viewCount || 0), 0),
    };
  } catch (error) {
    console.error("Error getting story stats:", error);
    throw error;
  }
};
