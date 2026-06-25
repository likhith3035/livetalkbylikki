import { supabase } from "@/integrations/supabase/client";
import { registerRoomMedia } from "@/features/temp-rooms/roomService";
import { ROOM_TTL_MS } from "@/features/shared/constants";

/** Track upload in Firebase metadata + Supabase for expiry cleanup */
export async function trackRoomMediaUpload(roomId: string, storagePath: string): Promise<void> {
  await registerRoomMedia(roomId, storagePath);

  const expiresAt = new Date(Date.now() + ROOM_TTL_MS).toISOString();
  const { error } = await supabase.from("room_media").insert({
    room_id: roomId,
    storage_path: storagePath,
    expires_at: expiresAt,
  });

  if (error) {
    // Table may not exist until migration runs — Firebase ref still tracks path
    console.warn("[Media] room_media insert:", error.message);
  }
}
