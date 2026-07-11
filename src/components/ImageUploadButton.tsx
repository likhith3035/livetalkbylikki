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
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const path = roomId ? `${roomId}/${fileName}` : fileName;

      const { error } = await supabase.storage
        .from("chat-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      if (roomId) {
        await trackRoomMediaUpload(roomId, path);
      }

      const { data } = supabase.storage.from("chat-images").getPublicUrl(path);
      onUpload(data.publicUrl);
    } catch (err: any) {
      console.error("Upload failed:", err);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err.message || "An error occurred while uploading the image."
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
        onClick={() => fileRef.current?.click()}
        disabled={disabled || uploading}
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
