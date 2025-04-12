// Import the Firebase services you actually use
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ✅ Your Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBX6kaF67ufXpxEBo4NMI4Sd6vWe0beu9k",
    authDomain: "syntellect-9ca3e.firebaseapp.com",
    projectId: "syntellect-9ca3e",
    storageBucket: "syntellect-9ca3e.firebasestorage.app",
    messagingSenderId: "774591466199",
    appId: "1:774591466199:web:180d687c3a40bad5f3fe92",
    measurementId: "G-LKXNZ2LPKT"
  };

// 🔥 Initialize Firebase services
const app = initializeApp(firebaseConfig);

// Export what your app will use
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
