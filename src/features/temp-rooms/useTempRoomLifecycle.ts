import { useEffect, useRef, useCallback } from "react";
import {
  subscribeRoomMeta,
  touchRoomExpiry,
  isRoomExpired,
} from "./roomService";
import { cleanupExpiredRoom } from "./mediaCleanup";

interface UseTempRoomLifecycleOptions {
  roomId: string | null;
  sessionId: string;
  enabled?: boolean;
  onExpired?: () => void;
}

/** Presence-driven TTL lifecycle — keeps Firebase load minimal (metadata only) */
export function useTempRoomLifecycle({
  roomId,
  sessionId,
  enabled = true,
  onExpired,
}: UseTempRoomLifecycleOptions) {
  const onExpiredRef = useRef(onExpired);
  useEffect(() => { onExpiredRef.current = onExpired; }, [onExpired]);

  const checkExpiry = useCallback(async () => {
    if (!roomId) return;
    const expired = await isRoomExpired(roomId);
    if (expired) {
      await cleanupExpiredRoom(roomId);
      onExpiredRef.current?.();
    }
  }, [roomId]);

  useEffect(() => {
    if (!enabled || !roomId || !sessionId) return;

    let unsubMeta: (() => void) | undefined;
    let heartbeat: ReturnType<typeof setInterval> | undefined;

    (async () => {
      const expired = await isRoomExpired(roomId);
      if (expired) {
        await cleanupExpiredRoom(roomId);
        onExpiredRef.current?.();
        return;
      }

      await touchRoomExpiry(roomId);

      unsubMeta = subscribeRoomMeta(roomId, (meta) => {
        if (meta && Date.now() > meta.expiresAt) {
          cleanupExpiredRoom(roomId).then(() => onExpiredRef.current?.());
        }
      });

      heartbeat = setInterval(() => touchRoomExpiry(roomId), 5 * 60 * 1000);
    })();

    return () => {
      heartbeat && clearInterval(heartbeat);
      unsubMeta?.();
    };
  }, [enabled, roomId, sessionId]);

  return { checkExpiry };
}
