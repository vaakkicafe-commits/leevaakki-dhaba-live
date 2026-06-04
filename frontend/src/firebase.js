import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Same Firebase project as Cafe — both brands share one Firebase Auth
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAoyqpMIqxdDScXeg5k6jDkVOS0WFbI1Bg",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "lee-vaakki-pvt-ltd-33e4e.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "lee-vaakki-pvt-ltd-33e4e",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "lee-vaakki-pvt-ltd-33e4e.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "57170940897",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:57170940897:web:9af934a0a55b7b5f5cf8a0",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
