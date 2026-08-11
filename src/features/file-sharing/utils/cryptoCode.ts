import { FileCategory } from "../types";

// Unambiguous, uppercase alphanumeric character set (omits 0, O, 1, I, L)
const CHAR_SET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/**
 * Generate a cryptographically secure 6-character share code
 * Example output: K7X4P9
 */
export function generateShareCode(length = 6): string {
  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHAR_SET[values[i] % CHAR_SET.length];
  }
  return code;
}

/**
 * Hash password string using native SHA-256 crypto API
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Check if a file extension is dangerous executable
 */
const BLOCKED_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "sh", "msi", "vbs", "ps1", "scr", "jar", "com",
  "pif", "application", "gadget", "msp", "hta", "cpl", "msc", "jar"
]);

export function isExecutableFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return BLOCKED_EXTENSIONS.has(ext);
}

/**
 * Categorize file based on extension and MIME type
 */
export function detectFileCategory(fileName: string, mimeType: string): FileCategory {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "tiff"].includes(ext) || mimeType.startsWith("image/")) {
    return "images";
  }
  if (["mp4", "webm", "mkv", "avi", "mov", "wmv", "flv"].includes(ext) || mimeType.startsWith("video/")) {
    return "videos";
  }
  if (["mp3", "wav", "ogg", "m4a", "flac", "aac"].includes(ext) || mimeType.startsWith("audio/")) {
    return "audio";
  }
  if (["zip", "rar", "7z", "tar", "gz", "bz2", "xz"].includes(ext) || mimeType.includes("zip") || mimeType.includes("compressed")) {
    return "archives";
  }
  if (
    ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "md", "csv", "json", "rtf", "odt"].includes(ext) ||
    mimeType.startsWith("text/") ||
    mimeType.includes("pdf") ||
    mimeType.includes("word") ||
    mimeType.includes("sheet")
  ) {
    return "documents";
  }

  return "other";
}

/**
 * Format bytes into human readable string (e.g. 12.4 MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Sanitize filename to prevent path traversal or unsafe characters
 */
export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Encrypt data using AES-256 GCM Web Crypto API
 */
export async function encryptData(data: string, secretKey: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(secretKey.padStart(32, "0").slice(0, 32)),
    "AES-GCM",
    false,
    ["encrypt"]
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    keyMaterial,
    enc.encode(data)
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt data using AES-256 GCM Web Crypto API
 */
export async function decryptData(encryptedBase64: string, secretKey: string): Promise<string> {
  const binary = atob(encryptedBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const iv = bytes.slice(0, 12);
  const ciphertext = bytes.slice(12);

  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(secretKey.padStart(32, "0").slice(0, 32)),
    "AES-GCM",
    false,
    ["decrypt"]
  );

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    keyMaterial,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}
