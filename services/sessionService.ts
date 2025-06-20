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
  where,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export interface SessionBooking {
  id: string;
  counselorId: string;
  counselorName: string;
  clientId: string;
  clientName: string;
  date: Date;
  duration: number; // in minutes
  type: "therapy" | "consultation" | "follow-up" | "crisis-support";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  price: number;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionData {
  counselorId: string;
  counselorName: string;
  clientId: string;
  clientName: string;
  date: Date;
  duration: number;
  type: "therapy" | "consultation" | "follow-up" | "crisis-support";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  price: number;
  location: string;
}

const SESSIONS_COLLECTION = "sessions";

export const createSessionBooking = async (
  sessionData: SessionData,
): Promise<string> => {
  try {
    const now = new Date();
    const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), {
      ...sessionData,
      date: Timestamp.fromDate(sessionData.date),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating session booking:", error);
    throw new Error("Failed to create session booking");
  }
};

export const getUserSessions = async (
  userId: string,
  userRole: "client" | "counselor",
): Promise<SessionBooking[]> => {
  try {
    const fieldName = userRole === "client" ? "clientId" : "counselorId";
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where(fieldName, "==", userId),
      orderBy("date", "desc"),
    );

    const querySnapshot = await getDocs(q);
    const sessions: SessionBooking[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        counselorId: data.counselorId,
        counselorName: data.counselorName,
        clientId: data.clientId,
        clientName: data.clientName,
        date: data.date.toDate(),
        duration: data.duration,
        type: data.type,
        status: data.status,
        notes: data.notes,
        price: data.price,
        location: data.location,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      });
    });

    return sessions;
  } catch (error) {
    console.error("Error getting user sessions:", error);
    throw new Error("Failed to load sessions");
  }
};

export const getSessionById = async (
  sessionId: string,
): Promise<SessionBooking | null> => {
  try {
    const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        counselorId: data.counselorId,
        counselorName: data.counselorName,
        clientId: data.clientId,
        clientName: data.clientName,
        date: data.date.toDate(),
        duration: data.duration,
        type: data.type,
        status: data.status,
        notes: data.notes,
        price: data.price,
        location: data.location,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting session by ID:", error);
    throw new Error("Failed to load session");
  }
};

export const updateSessionStatus = async (
  sessionId: string,
  status: SessionBooking["status"],
): Promise<void> => {
  try {
    const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error("Error updating session status:", error);
    throw new Error("Failed to update session status");
  }
};

export const cancelSession = async (sessionId: string): Promise<void> => {
  try {
    await updateSessionStatus(sessionId, "cancelled");
  } catch (error) {
    console.error("Error cancelling session:", error);
    throw new Error("Failed to cancel session");
  }
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting session:", error);
    throw new Error("Failed to delete session");
  }
};

export const updateSessionNotes = async (
  sessionId: string,
  notes: string,
): Promise<void> => {
  try {
    const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await updateDoc(docRef, {
      notes,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error("Error updating session notes:", error);
    throw new Error("Failed to update session notes");
  }
};

// Mock data for development (remove in production)
export const getMockSessions = (): SessionBooking[] => {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);

  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  const lastWeek = new Date();
  lastWeek.setDate(now.getDate() - 7);

  return [
    {
      id: "1",
      counselorId: "counselor1",
      counselorName: "Dr. Sarah Johnson",
      clientId: "client1",
      clientName: "John Doe",
      date: tomorrow,
      duration: 50,
      type: "therapy",
      status: "confirmed",
      notes: "Regular therapy session - focus on anxiety management",
      price: 100,
      location: "Virtual Session",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "2",
      counselorId: "counselor2",
      counselorName: "Dr. Michael Brown",
      clientId: "client1",
      clientName: "John Doe",
      date: nextWeek,
      duration: 60,
      type: "consultation",
      status: "pending",
      notes: "Initial consultation for new client",
      price: 80,
      location: "Virtual Session",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "3",
      counselorId: "counselor1",
      counselorName: "Dr. Sarah Johnson",
      clientId: "client1",
      clientName: "John Doe",
      date: lastWeek,
      duration: 50,
      type: "therapy",
      status: "completed",
      notes: "Great progress on coping strategies",
      price: 100,
      location: "Virtual Session",
      createdAt: lastWeek,
      updatedAt: lastWeek,
    },
  ];
};
