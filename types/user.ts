// User types for mental health support app

export type UserRole = "user" | "counsellor" | "admin";

// Notification settings interface
export interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  sessionReminders: boolean;
  messageNotifications: boolean;
}

// Default notification settings
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pushNotifications: true,
  emailNotifications: true,
  sessionReminders: true,
  messageNotifications: true,
};

export interface DocumentFile {
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: any;
}

export interface CounsellorDocuments {
  license?: DocumentFile;
  degree?: DocumentFile;
  certification?: DocumentFile;
  insurance?: DocumentFile;
  resume?: DocumentFile;
}

export interface BaseUserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  status: "online" | "offline" | "away";
  lastSeen: any;
  createdAt: any;
  pushToken?: string;
  pushTokenUpdatedAt?: any;
  role: UserRole;
  isProfileComplete: boolean;
  isApproved?: boolean; // For counsellors
  notificationSettings?: NotificationSettings; // User notification preferences
}

// User-specific profile data
export interface UserProfileData extends BaseUserProfile {
  role: "user";
  // Personal information
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "non-binary" | "prefer-not-to-say";
  phone?: string;

  // Mental health information
  primaryConcerns: string[]; // e.g., ['anxiety', 'depression', 'stress', 'trauma']
  severityLevel?: "mild" | "moderate" | "severe";
  previousTherapy?: boolean;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };

  // Preferences
  preferredCounsellorGender?: "male" | "female" | "no-preference";
  preferredLanguage?: string;
  preferredSessionType?: "video" | "audio" | "chat" | "any";
  availableHours?: {
    start: string; // e.g., "09:00"
    end: string; // e.g., "17:00"
    timezone: string;
  };

  // Crisis information
  hasSuicidalThoughts?: boolean;
  inCrisis?: boolean;
  crisisHotlineNumber?: string;
}

// Counsellor-specific profile data
export interface CounsellorProfileData extends BaseUserProfile {
  bio: string;
  credentials: string;
  role: "counsellor";
  // Professional information
  firstName: string;
  lastName: string;
  licenseNumber: string;
  licenseType: string; // e.g., 'Licensed Clinical Social Worker', 'Licensed Professional Counselor'
  yearsExperience: number;

  // Specializations and expertise
  specializations: string[]; // e.g., ['anxiety', 'depression', 'trauma', 'addiction']
  approaches: string[]; // e.g., ['CBT', 'DBT', 'Mindfulness', 'Psychodynamic']
  ageGroups: string[]; // e.g., ['children', 'teens', 'adults', 'seniors']

  // Availability and preferences
  hourlyRate?: number;
  currency?: string;
  availableHours: {
    monday?: { start: string; end: string; available: boolean };
    tuesday?: { start: string; end: string; available: boolean };
    wednesday?: { start: string; end: string; available: boolean };
    thursday?: { start: string; end: string; available: boolean };
    friday?: { start: string; end: string; available: boolean };
    saturday?: { start: string; end: string; available: boolean };
    sunday?: { start: string; end: string; available: boolean };
    timezone: string;
  };

  // Professional verification
  verificationDocuments?: CounsellorDocuments; // Updated to use proper document structure
  verificationStatus: "pending" | "verified" | "rejected";
  verificationNotes?: string;
  verifiedAt?: any;
  verifiedBy?: string; // Admin UID who verified

  // Statistics
  totalSessions?: number;
  averageRating?: number;
  totalReviews?: number;

  // Preferences
  maxClientsPerWeek?: number;
  acceptsNewClients: boolean;
  languages: string[];
}

// Admin-specific profile data
export interface AdminProfileData extends BaseUserProfile {
  role: "admin";
  firstName: string;
  lastName: string;
  permissions: AdminPermission[];
  createdBy?: string; // Super admin who created this admin
}

export interface AdminPermission {
  resource: "counsellors" | "users" | "sessions" | "reports" | "settings";
  actions: ("read" | "write" | "approve" | "reject" | "delete")[];
}

export type UserProfile =
  | UserProfileData
  | CounsellorProfileData
  | AdminProfileData;

// Mental health concern options
export const MENTAL_HEALTH_CONCERNS = [
  "anxiety",
  "depression",
  "stress",
  "trauma",
  "grief",
  "relationship-issues",
  "family-problems",
  "work-stress",
  "self-esteem",
  "addiction",
  "eating-disorders",
  "bipolar-disorder",
  "panic-attacks",
  "social-anxiety",
  "phobias",
  "ocd",
  "ptsd",
  "anger-management",
  "sleep-issues",
  "life-transitions",
  "other",
] as const;

// Therapy approaches
export const THERAPY_APPROACHES = [
  "CBT", // Cognitive Behavioral Therapy
  "DBT", // Dialectical Behavior Therapy
  "ACT", // Acceptance and Commitment Therapy
  "EMDR", // Eye Movement Desensitization and Reprocessing
  "Psychodynamic",
  "Humanistic",
  "Mindfulness-Based",
  "Solution-Focused",
  "Family Therapy",
  "Group Therapy",
  "Art Therapy",
  "Music Therapy",
  "Other",
] as const;

// License types for counsellors
export const LICENSE_TYPES = [
  "Licensed Clinical Social Worker (LCSW)",
  "Licensed Professional Counselor (LPC)",
  "Licensed Marriage and Family Therapist (LMFT)",
  "Licensed Clinical Mental Health Counselor (LCMHC)",
  "Licensed Professional Clinical Counselor (LPCC)",
  "Licensed Mental Health Counselor (LMHC)",
  "Licensed Addiction Counselor (LAC)",
  "Licensed Psychologist (LP)",
  "Other",
] as const;
