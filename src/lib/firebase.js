import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

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
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return {
      id: user.uid,
      name: user.displayName || user.email?.split("@")[0] || "User",
      email: user.email,
      phone: user.phoneNumber || "9999999999",
      profilePhoto: user.photoURL || "",
      role: "customer",
      isAdmin: false,
    };
  } catch (error) {
    if (error.code === "auth/internal-error" || error.code === "auth/operation-not-allowed") {
      throw new Error(
        "Google Sign-In is not enabled yet in your Firebase Console for project 'pharmacy-ecfa5'. Please go to Firebase Console -> Authentication -> Sign-in method -> Enable Google."
      );
    }
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in popup was closed before completing.");
    }
    throw error;
  }
}

export let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}
