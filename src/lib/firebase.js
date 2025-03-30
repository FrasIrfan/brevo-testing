'use client';

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCBHSeHPg9PVB9hxxGf45mXzjnHqMgCoFc",
  authDomain: "messaging-f618b.firebaseapp.com",
  projectId: "messaging-f618b",
  storageBucket: "messaging-f618b.firebasestorage.app",
  messagingSenderId: "417374440205",
  appId: "1:417374440205:web:9385f5b9b6dae97f4f7e44",
  measurementId: "G-QP2CBLY3ZN"
};

let firebaseApp;
let analytics;

try {
  firebaseApp = initializeApp(firebaseConfig);
  // Only initialize analytics on the client side
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(firebaseApp);
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// Initialize Firebase services
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();

// Enable Firebase Auth persistence
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
      console.error("Auth persistence error:", error);
    });
}

export { firebaseApp as app, auth, db, analytics, googleProvider, signInWithPopup }; 