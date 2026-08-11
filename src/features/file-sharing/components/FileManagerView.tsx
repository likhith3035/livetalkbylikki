import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  SharedFileItem, FolderItem, SortOption, FileCategory, StorageUsageStats
} from "../types";
import {
  getSavedFiles, getSavedFolders, createFolder, moveFileToFolder,
  toggleFileTrash, calculateStorageUsage, filterAndSortFiles, deleteFilePermanently
} from "../services/fileSharingService";
import { formatBytes, encryptData, decryptData } from "../utils/cryptoCode";
import { FilePreviewModal } from "./FilePreviewModal";
import {
  Folder, FolderPlus, Search, Filter, ArrowUpDown, Trash2, Eye, Download,
  FileText, HardDrive, MoreVertical, Sparkles, FolderOpen, Tag, Check, Move, Lock, Unlock
} from "lucide-react";
import { toast } from "sonner";

interface FileManagerViewProps {
  onSelectFilesForShare?: (files: SharedFileItem[]) => void;
}

export const FileManagerView: React.FC<FileManagerViewProps> = ({
  onSelectFilesForShare,
}) => {
  const [files, setFiles] = useState<SharedFileItem[]>(getSavedFiles);
  const [folders, setFolders] = useState<FolderItem[]>(getSavedFolders);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [newFolderName, setNewFolderName] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<SharedFileItem | null>(null);

  const storageStats = calculateStorageUsage();

  const handleRefresh = () => {
    setFiles(getSavedFiles());
    setFolders(getSavedFolders());
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = createFolder(newFolderName);
      setFolders((prev) => [...prev, created]);
      setNewFolderName("");
      setShowCreateFolder(false);
      toast.success(`Folder "${created.name}" created!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create folder.");
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedFileIds.size === displayedFiles.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(displayedFiles.map((f) => f.id)));
    }
  };

  const handleMoveToTrash = (fileId: string) => {
    toggleFileTrash(fileId, true);
    handleRefresh();
    toast.success("Moved file to Trash.");
  };

  const handleEncryptSelected = async () => {
    const selected = files.filter((f) => selectedFileIds.has(f.id));
    if (!selected.length) {
      toast.error("Please select at least one file to encrypt.");
      return;
    }

    const passcode = prompt("Enter a secret passcode for AES-256 Web Crypto encryption:");
    if (!passcode || !passcode.trim()) return;

    try {
      const updated = await Promise.all(
        files.map(async (f) => {
          if (selectedFileIds.has(f.id)) {
            const encryptedUrl = await encryptData(f.url, passcode.trim());
            return {
              ...f,
              url: `enc:${encryptedUrl}`,
              name: f.name.startsWith("🔒 ") ? f.name : `🔒 ${f.name}`,
            };
          }
          return f;
        })
      );

      saveFiles(updated);
      setFiles(updated);
      setSelectedFileIds(new Set());
      toast.success(`Encrypted ${selected.length} file(s) with AES-256 Web Crypto API!`);
    } catch {
      toast.error("Failed to encrypt files.");
    }
  };

  const handleDecryptSelected = async () => {
    const selected = files.filter((f) => selectedFileIds.has(f.id) && f.url.startsWith("enc:"));
    if (!selected.length) {
      toast.error("Please select encrypted file(s) to unlock.");
      return;
    }

    const passcode = prompt("Enter passcode to unlock AES-256 encrypted file(s):");
    if (!passcode || !passcode.trim()) return;

    try {
      const updated = await Promise.all(
        files.map(async (f) => {
          if (selectedFileIds.has(f.id) && f.url.startsWith("enc:")) {
            const rawEnc = f.url.replace("enc:", "");
            const decryptedUrl = await decryptData(rawEnc, passcode.trim());
            return {
              ...f,
              url: decryptedUrl,
              name: f.name.replace(/^🔒\s*/, ""),
            };
          }
          return f;
        })
      );

      saveFiles(updated);
      setFiles(updated);
      setSelectedFileIds(new Set());
      toast.success("Decrypted and unlocked file(s)!");
    } catch {
      toast.error("Incorrect passcode. Decryption failed.");
    }
  };

  const handleCreateShareFromSelected = () => {
    const selected = files.filter((f) => selectedFileIds.has(f.id));
    if (!selected.length) {
      toast.error("Please select at least one file.");
      return;
    }
    onSelectFilesForShare?.(selected);
  };

  const displayedFiles = filterAndSortFiles({
    files,
    category: activeCategory,
    searchQuery,
    sortOption,
    folderId: selectedFolderId,
    inTrash: false,
  });

  const categoriesList: { id: string; label: string }[] = [
    { id: "all", label: "All Files" },
    { id: "documents", label: "📄 Documents" },
    { id: "images", label: "🖼️ Images" },
    { id: "videos", label: "🎬 Videos" },
    { id: "audio", label: "🎵 Audio" },
    { id: "archives", label: "📦 Archives" },
  ];

  return (
    <div className="space-y-6">
      {/* Storage Usage Bar */}
      <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold">
              <HardDrive className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Storage Usage</h4>
              <p className="text-xs text-muted-foreground">
                {formatBytes(storageStats.usedBytes)} / {formatBytes(storageStats.totalBytes)} used
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-primary">
            {Math.round((storageStats.usedBytes / storageStats.totalBytes) * 100)}%
          </span>
        </div>

        <Progress
          value={Math.min(100, Math.round((storageStats.usedBytes / storageStats.totalBytes) * 100))}
          className="h-2 rounded-full"
        />
      </div>

      {/* Folders Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Folder className="h-3.5 w-3.5 text-primary" /> Folders ({folders.length})
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCreateFolder(!showCreateFolder)}
            className="text-xs gap-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
          >
            <FolderPlus className="h-3.5 w-3.5" /> New Folder
          </Button>
        </div>

        {showCreateFolder && (
          <form onSubmit={handleCreateFolderSubmit} className="flex gap-2 p-3 rounded-2xl bg-card border border-border/70">
            <Input
              type="text"
              placeholder="Folder Name (e.g. Work Docs)"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="text-xs rounded-xl"
            />
            <Button type="submit" size="sm" className="text-xs rounded-xl bg-primary">
              Create
            </Button>
          </form>
        )}

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedFolderId(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border shrink-0 transition-all flex items-center gap-1.5 ${
              selectedFolderId === null
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground"
            }`}
          >
            <FolderOpen className="h-3.5 w-3.5" /> All Folders
          </button>

          {folders.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFolderId(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border shrink-0 transition-all flex items-center gap-1.5 ${
                selectedFolderId === f.id
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground"
              }`}
            >
              <Folder className="h-3.5 w-3.5" /> {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filters, Search & Sort Bar */}
      <div className="bg-card border border-border/80 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search files by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs rounded-xl"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="h-9 text-xs font-semibold rounded-xl bg-secondary/50 border border-border/70 text-foreground px-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="size_largest">Size (Largest)</option>
              <option value="size_smallest">Size (Smallest)</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          {categoriesList.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border shrink-0 transition-all ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Batch Action Toolbar */}
      {selectedFileIds.size > 0 && (
        <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <span className="text-xs font-bold text-primary shrink-0">
            {selectedFileIds.size} file(s) selected
          </span>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleEncryptSelected}
              className="text-xs font-bold rounded-xl gap-1.5 border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
            >
              <Lock className="h-3.5 w-3.5" /> AES-256 Encrypt
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleDecryptSelected}
              className="text-xs font-bold rounded-xl gap-1.5 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
            >
              <Unlock className="h-3.5 w-3.5" /> Decrypt File(s)
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleCreateShareFromSelected}
              className="text-xs font-bold rounded-xl gap-1.5 bg-primary text-primary-foreground"
            >
              <Sparkles className="h-3.5 w-3.5" /> Share Selected
            </Button>
          </div>
        </div>
      )}

      {/* File List / Grid View */}
      {displayedFiles.length > 0 ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <button
              onClick={handleSelectAll}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            >
              <input
                type="checkbox"
                checked={selectedFileIds.size === displayedFiles.length && displayedFiles.length > 0}
                onChange={handleSelectAll}
                className="rounded accent-primary"
              />
              Select All ({displayedFiles.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayedFiles.map((fileItem) => {
              const isSelected = selectedFileIds.has(fileItem.id);
              return (
                <div
                  key={fileItem.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 relative group ${
                    isSelected
                      ? "bg-primary/10 border-primary shadow-md"
                      : "bg-card border-border/80 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(fileItem.id)}
                        className="rounded accent-primary h-4 w-4 shrink-0"
                      />

                      <div className="h-10 w-10 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {fileItem.name}
                        </p>
                        <span className="text-[10px] font-mono text-muted-foreground block">
                          {formatBytes(fileItem.size)} • {new Date(fileItem.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMoveToTrash(fileItem.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary transition-all opacity-0 group-hover:opacity-100 shrink-0"
                      title="Move to Trash"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewFile(fileItem)}
                      className="flex-1 text-[11px] rounded-xl gap-1 border-border/60 h-7"
                    >
                      <Eye className="h-3 w-3" /> Preview
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onSelectFilesForShare?.([fileItem])}
                      className="flex-1 text-[11px] rounded-xl gap-1 bg-primary text-primary-foreground h-7 font-bold"
                    >
                      <Sparkles className="h-3 w-3" /> Share
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="p-10 rounded-3xl bg-card border border-border/80 text-center space-y-3">
          <FolderOpen className="h-10 w-10 text-muted-foreground/60 mx-auto" />
          <h4 className="text-base font-display font-bold text-foreground">No Files Found</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? `No files match "${searchQuery}" in this folder.`
              : "You haven't uploaded any files yet."}
          </p>
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </div>
  );
};
