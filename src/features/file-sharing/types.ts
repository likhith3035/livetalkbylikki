export type FileCategory = "documents" | "images" | "videos" | "audio" | "archives" | "other";

export type ShareStatus = "active" | "expired" | "disabled" | "limit_reached" | "burned";

export type ExpirationOption = "never" | "1h" | "1d" | "7d" | "30d";

export type DownloadLimitOption = "unlimited" | "1" | "5" | "10" | "25" | "burn";

export type SortOption = "newest" | "oldest" | "name_asc" | "name_desc" | "size_largest" | "size_smallest";

export interface SharedFileItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  category: FileCategory;
  url: string;
  storagePath?: string;
  uploadedAt: number;
  folderId?: string | null;
  isInTrash?: boolean;
  trashedAt?: number | null;
}

export type ShareType = "file" | "text" | "password";

export interface PasswordCredentialPayload {
  title: string;
  username?: string;
  password?: string;
  notes?: string;
}

export interface ShareRecord {
  id: string;
  code: string; // e.g. K7X4P9
  files: SharedFileItem[];
  createdAt: number;
  expiresAt: number | null; // timestamp or null
  expirationOption: ExpirationOption;
  maxDownloads: number | null; // number or null (unlimited)
  downloadCount: number;
  hasPassword: boolean;
  passwordHash?: string;
  status: ShareStatus;
  isBurnAfterReading?: boolean;
  disabledAt?: number | null;
  lastDownloadedAt?: number | null;
  shareType?: ShareType;
  textContent?: string;
  credentialData?: PasswordCredentialPayload;
}

export interface FolderItem {
  id: string;
  name: string;
  createdAt: number;
}

export interface UploadProgressItem {
  id: string;
  file: File;
  progress: number; // 0 to 100
  status: "uploading" | "completed" | "error" | "cancelled";
  speedBytesPerSec?: number;
  remainingSeconds?: number;
  startTime?: number;
  errorMessage?: string;
}

export interface StorageUsageStats {
  usedBytes: number;
  totalBytes: number; // Configurable max limit (default 10 GB)
  byCategory: Record<FileCategory, number>;
}
