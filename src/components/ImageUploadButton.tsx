import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { trackRoomMediaUpload } from "@/features/temp-rooms/registerMediaUpload";

interface ImageUploadButtonProps {
  disabled: boolean;
  onUpload: (url: string) => void;
  roomId?: string | null;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const ImageUploadButton = ({ disabled, onUpload, roomId }: ImageUploadButtonProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, GIF, WEBP)."
      });
      return;
    }
    if (file.size > MAX_SIZE) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "The selected image exceeds the maximum size limit of 5MB."
      });
      return;
    }

    setUploading(true);
    try {
      const rawExt = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
      const ALLOWED_EXTS = ["jpg", "jpeg", "png", "gif", "webp"];
      const ext = ALLOWED_EXTS.includes(rawExt) ? rawExt : "jpg";
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const cleanRoomId = roomId ? roomId.replace(/[^a-zA-Z0-9-_]/g, "") : null;
      const path = cleanRoomId ? `${cleanRoomId}/${fileName}` : fileName;

      const { error } = await supabase.storage
        .from("chat-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      if (cleanRoomId) {
        await trackRoomMediaUpload(cleanRoomId, path);
      }

      const { data } = supabase.storage.from("chat-images").getPublicUrl(path);
      onUpload(data.publicUrl);
    } catch (err: unknown) {
      console.error("Upload failed:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred while uploading the image.";
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: errorMessage,
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={disabled || uploading}
        aria-label="Upload image"
        title="Upload image"
        className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-secondary/50 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
      </button>
    </>
  );
};

export default ImageUploadButton;
