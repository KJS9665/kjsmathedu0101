// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDB2xuxqvKqrrgsm7NgsSYo73UWy3hob5c",
  authDomain: "mathedu1-47450.firebaseapp.com",
  projectId: "mathedu1-47450",
  storageBucket: "mathedu1-47450.firebasestorage.app",
  messagingSenderId: "987627283464",
  appId: "1:987627283464:web:e33d46ddcaa1358d731dbd",
  measurementId: "G-V7T9QQPM24"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
