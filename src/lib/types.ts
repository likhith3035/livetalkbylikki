
import { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Unified interface for real-time communication channels.
 * This allows components to work with both Supabase Realtime 
 * and our Firebase-backed mock channels.
 */
export interface BaseChannel {
  on(type: "broadcast" | "presence" | "postgres_changes", 
     filter: { event: string; [key: string]: unknown }, 
     callback: (payload: unknown) => void): BaseChannel;
  
  off?(type: "broadcast" | "presence" | "postgres_changes", 
       filter: { event: string; [key: string]: unknown }): BaseChannel;
  
  subscribe(callback?: (status: string) => void): { unsubscribe: () => void };
  
  send(data: { type: string; event: string; payload: unknown }): Promise<unknown> | void;
  
  unsubscribe(): void;

  track?(state: Record<string, unknown>): Promise<unknown>;
  
  presenceState?(): Record<string, unknown>;

  roomId?: string;
}

// Type guard or helper to simplify component code
export type RoomChannel = BaseChannel | RealtimeChannel | null;
