import { describe, it, expect, vi } from "vitest";
import { sweepExpiredRooms } from "@/features/temp-rooms/mediaCleanup";
import * as roomService from "@/features/temp-rooms/roomService";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: () => ({
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
    from: () => ({
      delete: () => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  },
}));

describe("mediaCleanup", () => {
  it("should not cleanup active non-expired rooms", async () => {
    const getMetaSpy = vi.spyOn(roomService, "getRoomMeta").mockResolvedValue({
      roomId: "room123",
      createdAt: Date.now(),
      expiresAt: Date.now() + 100000,
      hostId: "user1",
    });

    const deleteTreeSpy = vi.spyOn(roomService, "deleteRoomTree").mockResolvedValue();

    await sweepExpiredRooms(["room123"]);

    expect(getMetaSpy).toHaveBeenCalledWith("room123");
    expect(deleteTreeSpy).not.toHaveBeenCalled();
  });
});
