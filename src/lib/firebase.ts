
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBTR-3XjPLDyp5fW761YF04WSoWoPwyvD0",
  authDomain: "video2-93f63.firebaseapp.com",
  projectId: "video2-93f63",
  storageBucket: "video2-93f63.firebasestorage.app",
  messagingSenderId: "269164360804",
  appId: "1:269164360804:web:3c65e98064150f9fcc1b71",
  measurementId: "G-VSDKLZWLWW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
