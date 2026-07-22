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
    } catch (err: any) {
      if (err?.code === "auth/api-key-expired" || err?.message?.includes("api-key-expired")) {
        console.error(
          "[Firebase Auth Error] Firebase API Key is EXPIRED or Invalid in Google Cloud/Firebase Console.\n" +
          "👉 Action required: Open Firebase Console -> Project Settings -> General -> Web API Key, renew/regenerate your API Key, and update VITE_FIREBASE_API_KEY in your .env file."
        );
      } else {
        console.error("[Auth] Anonymous sign-in failed:", err);
      }
      throw err;
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
