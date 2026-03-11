import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyCUOg11-khDZAABkc2v4sVcNtZOJiyfdsk",
  authDomain: "livetalkbylikki.firebaseapp.com",
  projectId: "livetalkbylikki",
  storageBucket: "livetalkbylikki.firebasestorage.app",
  messagingSenderId: "931757561400",
  appId: "1:931757561400:web:fa23f8e60c29a2a26038cd",
  databaseURL: "https://livetalkbylikki-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Passing the URL explicitly as well
export const db = getDatabase(app, firebaseConfig.databaseURL);

export default app;
