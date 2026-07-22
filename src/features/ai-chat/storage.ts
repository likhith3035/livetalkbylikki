import { APIKeysMap, Conversation } from "./types";

const KEYS_STORAGE_KEY = "livetalk_ai_api_keys";
const CONVERSATIONS_STORAGE_KEY = "livetalk_ai_conversations";

export function loadAPIKeys(): APIKeysMap {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore storage error */
  }
  return {};
}

export function saveAPIKeys(keys: APIKeysMap): void {
  try {
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch {
    /* ignore storage error */
  }
}

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore storage error */
  }
  return [];
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
  } catch {
    /* ignore storage error */
  }
}
