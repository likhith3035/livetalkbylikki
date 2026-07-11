import { supabase } from "@/integrations/supabase/client";
import { listRoomMediaPaths, deleteRoomTree, getRoomMeta } from "./roomService";

/** Delete Supabase objects linked to an expired room, then remove Firebase metadata */
export async function cleanupExpiredRoom(roomId: string): Promise<void> {
  const meta = await getRoomMeta(roomId);
  if (meta && Date.now() <= meta.expiresAt) return;

  const paths = await listRoomMediaPaths(roomId);
  if (paths.length > 0) {
    const { error } = await supabase.storage.from("chat-images").remove(paths);
    if (error) console.warn("[TempRoom] Supabase media cleanup:", error.message);

    // Delete database tracking references from room_media table in Supabase
    const { error: dbError } = await supabase.from("room_media").delete().eq("room_id", roomId);
    if (dbError) console.warn("[TempRoom] Supabase room_media deletion:", dbError.message);
  }

  await deleteRoomTree(roomId);
}

/** Client-side sweep — lightweight, scans only known room IDs passed in */
export async function sweepExpiredRooms(roomIds: string[]): Promise<void> {
  await Promise.all(
    roomIds.map(async (id) => {
      try {
        const meta = await getRoomMeta(id);
        if (meta && Date.now() > meta.expiresAt) {
          await cleanupExpiredRoom(id);
        }
      } catch {
        // ignore per-room failures
      }
    })
  );
}
