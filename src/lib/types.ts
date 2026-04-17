
import { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Unified interface for real-time communication channels.
 * This allows components to work with both Supabase Realtime 
 * and our Firebase-backed mock channels.
 */
export interface BaseChannel {
  on(type: "broadcast" | "presence" | "postgres_changes", 
     filter: { event: string; [key: string]: any }, 
     callback: (payload: any) => void): BaseChannel;
  
  subscribe(callback?: (status: string) => void): { unsubscribe: () => void };
  
  send(data: { type: string; event: string; payload: any }): Promise<any> | void;
  
  unsubscribe(): void;

  track?(state: any): Promise<any>;
  
  presenceState?(): any;
}

// Type guard or helper to simplify component code
export type RoomChannel = BaseChannel | RealtimeChannel | null;
