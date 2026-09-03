import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Firebase configuration from environment variables with safe dev fallbacks
const rawConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

// Validate config before initialization to prevent cryptic SDK errors
const requiredKeys = ['apiKey', 'projectId', 'databaseURL'] as const;
const missingKeys = requiredKeys.filter(
  key => !rawConfig[key] || rawConfig[key]?.startsWith('your_')
);

export const isFirebaseConfigured = missingKeys.length === 0;

if (!isFirebaseConfigured) {
  console.warn(
    `[Firebase] Missing or placeholder environment variables: ${missingKeys.join(', ')}.\n` +
    `👉 Running in local preview mode. Create or update your .env file with real Firebase credentials to enable live matchmaking and database synchronization.`
  );
}

// Safe development fallback configuration to prevent fatal SDK initialization crashes
const firebaseConfig = {
  apiKey: rawConfig.apiKey && !rawConfig.apiKey.startsWith('your_') ? rawConfig.apiKey : "AIzaSyDummyKeyForLocalDevOnly12345",
  authDomain: rawConfig.authDomain && !rawConfig.authDomain.startsWith('your_') ? rawConfig.authDomain : "livetalk-dev.firebaseapp.com",
  projectId: rawConfig.projectId && !rawConfig.projectId.startsWith('your_') ? rawConfig.projectId : "livetalk-dev",
  storageBucket: rawConfig.storageBucket && !rawConfig.storageBucket.startsWith('your_') ? rawConfig.storageBucket : "livetalk-dev.firebasestorage.app",
  messagingSenderId: rawConfig.messagingSenderId && !rawConfig.messagingSenderId.startsWith('your_') ? rawConfig.messagingSenderId : "123456789012",
  appId: rawConfig.appId && !rawConfig.appId.startsWith('your_') ? rawConfig.appId : "1:123456789012:web:abcdef123456",
  databaseURL: rawConfig.databaseURL && !rawConfig.databaseURL.startsWith('your_') && !rawConfig.databaseURL.includes('your_project_id')
    ? rawConfig.databaseURL
    : "https://livetalk-dev-default-rtdb.firebaseio.com/",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

export default app;

