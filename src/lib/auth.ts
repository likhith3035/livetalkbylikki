import { getAuth, signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import app from "./firebase";

export const auth = getAuth(app);

let currentUser: User | null = null;
let authPromise: Promise<User> | null = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

/** Ensure user is signed in anonymously and return their stable UID */
export async function getAnonymousUser(): Promise<User> {
  if (auth.currentUser) {
    currentUser = auth.currentUser;
    return auth.currentUser;
  }

  if (authPromise) {
    return authPromise;
  }

  authPromise = (async () => {
    try {
      const cred = await signInAnonymously(auth);
      currentUser = cred.user;
      return cred.user;
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string } | null;
      if (errorObj?.code === "auth/api-key-expired" || errorObj?.message?.includes("api-key-expired")) {
        console.warn(
          "[Firebase Auth Error] Firebase API Key is EXPIRED or Invalid in Google Cloud/Firebase Console.\n" +
          "👉 Action required: Open Firebase Console -> Project Settings -> General -> Web API Key, renew/regenerate your API Key, and update VITE_FIREBASE_API_KEY in your .env file."
        );
      } else if (err?.code === "auth/configuration-not-found" || err?.message?.includes("CONFIGURATION_NOT_FOUND")) {
        console.warn(
          "[Firebase Auth Warning] Anonymous Auth is not enabled in your Firebase Console.\n" +
          "👉 How to fix:\n" +
          "1. Open Firebase Console (https://console.firebase.google.com)\n" +
          "2. Go to Authentication -> Sign-in method tab\n" +
          "3. Select 'Anonymous' under Native Providers and click 'Enable' -> Save."
        );
      } else {
        console.warn("[Auth] Anonymous sign-in failed, using local stable ID fallback:", err);
      }
      
      // Fallback: Return a synthetic user object using local stable ID to prevent app crash
      const fallbackUser = { uid: getCurrentUserId() } as User;
      currentUser = fallbackUser;
      return fallbackUser;
    } finally {
      authPromise = null;
    }
  })();

  return authPromise;
}

/** Synchronous helper to get current authenticated user or fallback */
export function getCurrentUserId(): string {
  if (auth.currentUser) return auth.currentUser.uid;
  if (currentUser) return currentUser.uid;

  // Fallback to persisted stable ID if auth is still initializing
  let id = localStorage.getItem("echo_stable_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("echo_stable_id", id);
  }
  return id;
}
