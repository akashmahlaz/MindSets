import admin from "firebase-admin";

// Initialize Firebase Admin SDK
// For production, use a service account JSON file
// For development, we can use application default credentials or service account

const getFirebaseAdmin = () => {
  if (admin.apps.length === 0) {
    // Option 1: Full service account JSON from environment variable
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    // Option 2: Individual values from environment
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mental-health-f7b7f";
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (serviceAccountJson) {
      // Use full JSON if provided
      const parsedServiceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(parsedServiceAccount),
        projectId,
      });
    } else if (clientEmail && privateKey) {
      // Use individual credential values
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } else {
      // Fallback to application default credentials
      console.warn("Firebase Admin: No credentials found. Trying application default credentials...");
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
      });
    }
  }
  return admin;
};

export const adminApp = getFirebaseAdmin();
export const adminAuth = adminApp.auth();
export const adminDb = adminApp.firestore();
