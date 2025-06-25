// firebaseConfig.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics"; // Keep if you use Analytics
// Corrected imports for Auth with React Native persistence
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; // Make sure this package is installed!

import { getFirestore } from 'firebase/firestore'; // Import Firestore service

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCqhmuo0YiAU2QDKbbiMj8jEwyom-KkP8I",
  authDomain: "smartfampantryapp.firebaseapp.com",
  projectId: "smartfampantryapp",
  storageBucket: "smartfampantryapp.firebasestorage.app",
  messagingSenderId: "635277471195",
  appId: "1:635277471195:web:5c5e631a43d99c9aae4bfe",
  measurementId: "G-ZMNF5XTE9K" // Keep if you use Analytics
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics (optional, and may not work fully in all Expo Go environments)
// You might want to wrap this in an isSupported() check if you face persistent warnings
const analytics = getAnalytics(app);


// Initialize Firebase Auth with React Native Persistence
// This replaces 'export const auth = getAuth(app);'
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize other Firebase services
const db = getFirestore(app); // Export the Firestore service

// Export the Firebase app instance itself if needed elsewhere,
// but often you primarily export the services (auth, db, etc.)
export { auth, app, db }; // Named export for the app instance