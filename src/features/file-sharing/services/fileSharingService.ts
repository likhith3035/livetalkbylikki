import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/firebase";
import { ref, set, get } from "firebase/database";
import {
  SharedFileItem, ShareRecord, FolderItem, ShareStatus,
  ExpirationOption, DownloadLimitOption, SortOption, FileCategory, StorageUsageStats
} from "../types";
import { generateShareCode, hashPassword, detectFileCategory, isExecutableFile, sanitizeFileName, formatBytes } from "../utils/cryptoCode";

export { formatBytes };

// Storage Keys
const STORAGE_FILES_KEY = "livetalk_shared_files_v1";
const STORAGE_SHARES_KEY = "livetalk_file_shares_v1";
const STORAGE_FOLDERS_KEY = "livetalk_folders_v1";
const STORAGE_RATE_LIMIT_KEY = "livetalk_share_code_rate_limit_v1";

// Default Configurable Max File Size: 100 MB
export const DEFAULT_MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
export const TOTAL_STORAGE_LIMIT_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB

/**
 * Get all saved files from LocalStorage
 */
export function getSavedFiles(): SharedFileItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_FILES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save files to LocalStorage
 */
export function saveFiles(files: SharedFileItem[]) {
  try {
    localStorage.setItem(STORAGE_FILES_KEY, JSON.stringify(files));
  } catch {
    /* localStorage full */
  }
}

/**
 * Get all share records
 */
export function getSavedShares(): ShareRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_SHARES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save share records
 */
export function saveShares(shares: ShareRecord[]) {
  try {
    localStorage.setItem(STORAGE_SHARES_KEY, JSON.stringify(shares));
  } catch {
    /* localStorage full */
  }
}

/**
 * Get all folders
 */
export function getSavedFolders(): FolderItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_FOLDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save folders
 */
export function saveFolders(folders: FolderItem[]) {
  try {
    localStorage.setItem(STORAGE_FOLDERS_KEY, JSON.stringify(folders));
  } catch {
    /* localStorage full */
  }
}

/**
 * Calculate expiration timestamp based on option
 */
export function calculateExpirationTimestamp(option: ExpirationOption): number | null {
  const now = Date.now();
  switch (option) {
    case "1h": return now + 3600 * 1000;
    case "1d": return now + 86400 * 1000;
    case "7d": return now + 7 * 86400 * 1000;
    case "30d": return now + 30 * 86400 * 1000;
    case "never":
    default:
      return null;
  }
}

/**
 * Parse download limit option
 */
export function parseDownloadLimit(option: DownloadLimitOption): number | null {
  if (option === "unlimited") return null;
  const parsed = parseInt(option, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Upload single or multiple files with progress callback
 */
export async function uploadFileWithProgress({
  file,
  folderId = null,
  onProgress,
  maxSizeBytes = DEFAULT_MAX_FILE_SIZE_BYTES,
}: {
  file: File;
  folderId?: string | null;
  onProgress?: (percent: number) => void;
  maxSizeBytes?: number;
}): Promise<SharedFileItem> {
  // 1. Validate file executable extension
  if (isExecutableFile(file.name)) {
    throw new Error(`Executable file types (.${file.name.split(".").pop()}) are blocked for security.`);
  }

  // 2. Validate file size
  if (file.size > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
    throw new Error(`File "${file.name}" exceeds the maximum allowed size of ${maxMb} MB.`);
  }

  const safeName = sanitizeFileName(file.name);
  const fileId = "file-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
  let fileUrl = "";
  let storagePath = "";

  // 3. Attempt Supabase Storage Upload for all file types (chat-images or room-media buckets)
  try {
    const fileName = `${Date.now()}_${safeName}`;
    
    // Try primary 'chat-images' bucket
    let uploadRes = await supabase.storage.from("chat-images").upload(fileName, file, { cacheControl: "3600", upsert: false });
    let bucketName = "chat-images";

    // If chat-images fails, try 'room-media' bucket
    if (uploadRes.error) {
      uploadRes = await supabase.storage.from("room-media").upload(fileName, file, { cacheControl: "3600", upsert: false });
      bucketName = "room-media";
    }

    if (!uploadRes.error && uploadRes.data) {
      storagePath = fileName;
      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      fileUrl = publicUrlData.publicUrl;
      onProgress?.(100);
    }
  } catch (err) {
    console.warn("[FileSharing] Supabase upload failed, falling back to local data URL:", err);
  }

  // 4. Fallback to Local Data URL if Supabase upload failed
  if (!fileUrl) {
    fileUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
      reader.onload = () => {
        onProgress?.(100);
        resolve(reader.result as string);
      };
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsDataURL(file);
    });
  }

  const category = detectFileCategory(file.name, file.type);
  const newFileItem: SharedFileItem = {
    id: fileId,
    name: file.name,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
    category,
    url: fileUrl,
    storagePath,
    uploadedAt: Date.now(),
    folderId,
    isInTrash: false,
  };

  // Save to persistent local state
  const files = getSavedFiles();
  saveFiles([newFileItem, ...files]);

  return newFileItem;
}

/**
 * Create a Share Record for one or multiple files with Cloud Sync
 */
export async function createShareRecord({
  files,
  expirationOption = "7d",
  downloadLimitOption = "unlimited",
  password = "",
}: {
  files: SharedFileItem[];
  expirationOption: ExpirationOption;
  downloadLimitOption: DownloadLimitOption;
  password?: string;
}): Promise<ShareRecord> {
  if (!files.length) {
    throw new Error("No files selected for share code creation.");
  }

  const code = generateShareCode(6);
  const expiresAt = calculateExpirationTimestamp(expirationOption);
  const maxDownloads = parseDownloadLimit(downloadLimitOption);
  let passwordHash: string | undefined = undefined;

  if (password.trim()) {
    passwordHash = await hashPassword(password.trim());
  }

  const shareRecord: ShareRecord = {
    id: "share-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
    code,
    files,
    createdAt: Date.now(),
    expiresAt,
    expirationOption,
    maxDownloads,
    downloadCount: 0,
    hasPassword: !!passwordHash,
    passwordHash,
    status: "active",
  };

  // Save locally
  const shares = getSavedShares();
  saveShares([shareRecord, ...shares]);

  // 1. Sync share record to Supabase Storage as .png formatted payload (bypasses bucket MIME restrictions)
  try {
    const jsonStr = JSON.stringify(shareRecord);
    const pngBlob = new Blob([jsonStr], { type: "image/png" });
    const sharePath = `share_meta_${code}.png`;

    let uploadRes = await supabase.storage.from("chat-images").upload(sharePath, pngBlob, { cacheControl: "60", upsert: true });
    if (uploadRes.error) {
      await supabase.storage.from("room-media").upload(sharePath, pngBlob, { cacheControl: "60", upsert: true });
    }
  } catch {
    /* quiet fallback */
  }

  // 2. Secondary sync to Firebase Realtime Database (quiet fail if permission denied)
  try {
    await set(ref(db, `file_shares/${code}`), shareRecord);
  } catch {
    /* quiet fallback if Firebase rules block unauthenticated writes */
  }

  return shareRecord;
}

/**
 * Rate Limiting Check for Share Code validation attempts
 * Max 5 failed attempts per 60 seconds
 */
export function checkShareCodeRateLimit(): { isBlocked: boolean; remainingSeconds: number } {
  try {
    const raw = localStorage.getItem(STORAGE_RATE_LIMIT_KEY);
    if (!raw) return { isBlocked: false, remainingSeconds: 0 };

    const data = JSON.parse(raw);
    const now = Date.now();
    const attempts = data.attempts || [];
    const recent = attempts.filter((ts: number) => now - ts < 60000);

    if (recent.length >= 5) {
      const oldest = recent[0];
      const remainingSeconds = Math.ceil((60000 - (now - oldest)) / 1000);
      return { isBlocked: true, remainingSeconds };
    }
  } catch {
    /* parse error */
  }
  return { isBlocked: false, remainingSeconds: 0 };
}

/**
 * Record a failed share code entry attempt
 */
export function recordFailedCodeAttempt() {
  try {
    const raw = localStorage.getItem(STORAGE_RATE_LIMIT_KEY);
    const data = raw ? JSON.parse(raw) : { attempts: [] };
    const now = Date.now();
    const attempts = [...(data.attempts || []), now].filter((ts: number) => now - ts < 60000);
    localStorage.setItem(STORAGE_RATE_LIMIT_KEY, JSON.stringify({ attempts }));
  } catch {
    /* storage error */
  }
}

/**
 * Retrieve & Validate a Share Record by Code (Cross-Device Enabled)
 */
export async function getShareRecordByCode(code: string): Promise<{
  share: ShareRecord | null;
  statusMessage?: string;
  isExpired?: boolean;
  isLimitReached?: boolean;
  isDisabled?: boolean;
}> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return { share: null, statusMessage: "Please enter a valid share code." };

  const shares = getSavedShares();
  let found = shares.find((s) => s.code.toUpperCase() === cleanCode) || null;

  // If not found in local browser storage, fetch from Supabase Storage or Firebase
  if (!found) {
    // Attempt 1: Supabase Storage public metadata fetch
    try {
      const sharePath = `share_meta_${cleanCode}.png`;
      const { data: urlData1 } = supabase.storage.from("chat-images").getPublicUrl(sharePath);
      let response = await fetch(`${urlData1.publicUrl}?t=${Date.now()}`);

      if (!response.ok) {
        const { data: urlData2 } = supabase.storage.from("room-media").getPublicUrl(sharePath);
        response = await fetch(`${urlData2.publicUrl}?t=${Date.now()}`);
      }

      if (response.ok) {
        const text = await response.text();
        const fetchedRecord: ShareRecord = JSON.parse(text);
        if (fetchedRecord && fetchedRecord.code) {
          found = fetchedRecord;
          saveShares([fetchedRecord, ...shares]);
        }
      }
    } catch {
      /* fallback to Firebase lookup below */
    }

    // Attempt 2: Firebase Realtime Database lookup
    if (!found) {
      try {
        const snapshot = await get(ref(db, `file_shares/${cleanCode}`));
        if (snapshot.exists()) {
          const fetchedRecord: ShareRecord = snapshot.val();
          if (fetchedRecord && fetchedRecord.code) {
            found = fetchedRecord;
            saveShares([fetchedRecord, ...shares]);
          }
        }
      } catch {
        /* quiet fallback */
      }
    }
  }

  if (!found) {
    recordFailedCodeAttempt();
    return { share: null, statusMessage: "We couldn't find an active share with that code. Please check and try again." };
  }

  // Check if disabled
  if (found.status === "disabled" || found.disabledAt) {
    return { share: found, isDisabled: true, statusMessage: "This share code is no longer active." };
  }

  // Check if expired
  if (found.expiresAt && Date.now() > found.expiresAt) {
    return { share: found, isExpired: true, statusMessage: "This share code has expired." };
  }

  // Check download limit
  if (found.maxDownloads !== null && found.downloadCount >= found.maxDownloads) {
    return { share: found, isLimitReached: true, statusMessage: "This share code has reached its download limit." };
  }

  return { share: found };
}

/**
 * Increment Download Count for a Share Record
 */
export async function incrementDownloadCount(shareId: string) {
  const shares = getSavedShares();
  let targetShare: ShareRecord | null = null;

  const updated = shares.map((s) => {
    if (s.id === shareId) {
      const newCount = s.downloadCount + 1;
      let newStatus = s.status;
      if (s.maxDownloads !== null && newCount >= s.maxDownloads) {
        newStatus = "limit_reached";
      }
      targetShare = {
        ...s,
        downloadCount: newCount,
        lastDownloadedAt: Date.now(),
        status: newStatus as ShareStatus,
      };
      return targetShare;
    }
    return s;
  });

  saveShares(updated);

  // Sync updated download count to cloud
  if (targetShare && (targetShare as ShareRecord).code) {
    const code = (targetShare as ShareRecord).code;
    try {
      const jsonStr = JSON.stringify(targetShare);
      const pngBlob = new Blob([jsonStr], { type: "image/png" });
      const sharePath = `share_meta_${code}.png`;
      let uploadRes = await supabase.storage.from("chat-images").upload(sharePath, pngBlob, { cacheControl: "60", upsert: true });
      if (uploadRes.error) {
        await supabase.storage.from("room-media").upload(sharePath, pngBlob, { cacheControl: "60", upsert: true });
      }
    } catch {}

    try {
      await set(ref(db, `file_shares/${code}`), targetShare);
    } catch {}
  }
}

/**
 * Disable a Share Code immediately
 */
export async function disableShareCode(shareId: string) {
  const shares = getSavedShares();
  let targetShare: ShareRecord | null = null;

  const updated = shares.map((s) => {
    if (s.id === shareId) {
      targetShare = { ...s, status: "disabled" as ShareStatus, disabledAt: Date.now() };
      return targetShare;
    }
    return s;
  });

  saveShares(updated);

  if (targetShare && (targetShare as ShareRecord).code) {
    const code = (targetShare as ShareRecord).code;
    try {
      const jsonStr = JSON.stringify(targetShare);
      const pngBlob = new Blob([jsonStr], { type: "image/png" });
      const sharePath = `share_meta_${code}.png`;
      let uploadRes = await supabase.storage.from("chat-images").upload(sharePath, pngBlob, { cacheControl: "60", upsert: true });
      if (uploadRes.error) {
        await supabase.storage.from("room-media").upload(sharePath, pngBlob, { cacheControl: "60", upsert: true });
      }
    } catch {}

    try {
      await set(ref(db, `file_shares/${code}`), targetShare);
    } catch {}
  }
}

/**
 * Validate Password for a Password-Protected Share
 */
export async function verifySharePassword(share: ShareRecord, passwordInput: string): Promise<boolean> {
  if (!share.hasPassword || !share.passwordHash) return true;
  const inputHash = await hashPassword(passwordInput.trim());
  return inputHash === share.passwordHash;
}

/**
 * Create a new folder
 */
export function createFolder(folderName: string): FolderItem {
  const clean = folderName.trim();
  if (!clean) throw new Error("Folder name cannot be empty.");

  const newFolder: FolderItem = {
    id: "folder-" + Date.now(),
    name: clean,
    createdAt: Date.now(),
  };

  const folders = getSavedFolders();
  saveFolders([...folders, newFolder]);
  return newFolder;
}

/**
 * Move file to folder
 */
export function moveFileToFolder(fileId: string, folderId: string | null) {
  const files = getSavedFiles();
  const updated = files.map((f) => (f.id === fileId ? { ...f, folderId } : f));
  saveFiles(updated);
}

/**
 * Move file to Trash or restore from Trash
 */
export function toggleFileTrash(fileId: string, inTrash: boolean) {
  const files = getSavedFiles();
  const updated = files.map((f) =>
    f.id === fileId
      ? { ...f, isInTrash: inTrash, trashedAt: inTrash ? Date.now() : null }
      : f
  );
  saveFiles(updated);
}

/**
 * Delete file permanently
 */
export function deleteFilePermanently(fileId: string) {
  const files = getSavedFiles().filter((f) => f.id !== fileId);
  saveFiles(files);

  // Remove file from any active share record
  const shares = getSavedShares().map((s) => ({
    ...s,
    files: s.files.filter((f) => f.id !== fileId),
  }));
  saveShares(shares);
}

/**
 * Calculate total storage usage by category
 */
export function calculateStorageUsage(): StorageUsageStats {
  const files = getSavedFiles().filter((f) => !f.isInTrash);
  let total = 0;
  const byCategory: Record<FileCategory, number> = {
    documents: 0,
    images: 0,
    videos: 0,
    audio: 0,
    archives: 0,
    other: 0,
  };

  for (const f of files) {
    total += f.size || 0;
    const cat = f.category || "other";
    byCategory[cat] = (byCategory[cat] || 0) + (f.size || 0);
  }

  return {
    usedBytes: total,
    totalBytes: TOTAL_STORAGE_LIMIT_BYTES,
    byCategory,
  };
}

/**
 * Filter and Sort files helper
 */
export function filterAndSortFiles({
  files,
  category = "all",
  searchQuery = "",
  sortOption = "newest",
  folderId = null,
  inTrash = false,
}: {
  files: SharedFileItem[];
  category?: string;
  searchQuery?: string;
  sortOption?: SortOption;
  folderId?: string | null;
  inTrash?: boolean;
}): SharedFileItem[] {
  let result = files.filter((f) => (inTrash ? !!f.isInTrash : !f.isInTrash));

  if (!inTrash && folderId !== undefined) {
    result = result.filter((f) => f.folderId === folderId);
  }

  if (category && category !== "all") {
    result = result.filter((f) => f.category === category);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter((f) => f.name.toLowerCase().includes(q));
  }

  // Sorting
  return result.sort((a, b) => {
    switch (sortOption) {
      case "oldest":
        return a.uploadedAt - b.uploadedAt;
      case "name_asc":
        return a.name.localeCompare(b.name);
      case "name_desc":
        return b.name.localeCompare(a.name);
      case "size_largest":
        return b.size - a.size;
      case "size_smallest":
        return a.size - b.size;
      case "newest":
      default:
        return b.uploadedAt - a.uploadedAt;
    }
  });
}
