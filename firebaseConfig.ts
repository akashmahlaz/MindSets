// Import the functions you need from the SDKs you need
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FirebaseApp, initializeApp } from "firebase/app";
import { Auth, getAuth, initializeAuth } from "firebase/auth";
// @ts-ignore - getReactNativePersistence is available at runtime in React Native environment
import { getReactNativePersistence } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB646seJD8EN5rYbsSR9qTgE_GSoSpPyqs",
  authDomain: "mental-health-f7b7f.firebaseapp.com",
  projectId: "mental-health-f7b7f",
  storageBucket: "mental-health-f7b7f.firebasestorage.app",
  messagingSenderId: "952214463855",
  appId: "1:952214463855:web:631b1cdb75bb1e3961349a",
  measurementId: "G-H3QQ176Z7G",
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

// Initialize Auth with AsyncStorage persistence for React Native
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  // If initializeAuth fails (e.g., already initialized), get the existing auth instance
  console.log("Auth already initialized, using existing instance");
  auth = getAuth(app);
}

export { app, auth, db, storage };
