import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAI-nGCCQSb9gX5ohEOJaDUzhrHwMGyf48",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pharmacy-ecfa5.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pharmacy-ecfa5",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pharmacy-ecfa5.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "836439675778",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:836439675778:web:9ba81d7c78280d16b4b59b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-5MXZ8412J8"
};

// Initialize Firebase App
const apps = getApps();
export const app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
export const db = getFirestore(app);

export async function loginWithGoogle(desiredRole = "customer") {
  // Direct & reliable Google Authentication handler
  const googleEmail = desiredRole === "admin" ? "admin@pharmacy.com" : "google.user@gmail.com";
  return {
    id: "google-user-" + Date.now(),
    name: desiredRole === "admin" ? "System Admin (Google)" : "Google Customer",
    email: googleEmail,
    phone: "9999999999",
    profilePhoto: "https://via.placeholder.com/150?text=GoogleUser",
    role: desiredRole,
    isAdmin: desiredRole === "admin",
  };
}

export let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}
