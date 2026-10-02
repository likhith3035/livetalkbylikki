import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getDeviceSummary,
  getOrCreateDeviceId,
  createBeamSession,
  joinBeamSession,
  sendBeamTransfer,
  extendBeamSession,
  toggleSessionApproval,
  updateTransferApprovalStatus
} from "../features/file-sharing/services/beamService";

describe("Live QR Drop & Beam Sharing Service", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("detects friendly device summary based on userAgent", () => {
    const summary = getDeviceSummary();
    expect(summary).toBeDefined();
    expect(summary.name).toBeDefined();
    expect(["mobile", "desktop", "tablet"]).toContain(summary.type);
  });

  it("creates and persists a stable device ID in localStorage", () => {
    const id1 = getOrCreateDeviceId();
    expect(id1).toMatch(/^dev-/);

    const id2 = getOrCreateDeviceId();
    expect(id1).toBe(id2);
  });

  it("creates an active beam session with initial receiver metadata and TTL", async () => {
    const session = await createBeamSession("Test MacBook", 20, true);
    expect(session.id).toMatch(/^BEAM-/);
    expect(session.code).toHaveLength(4);
    expect(session.status).toBe("waiting");
    expect(session.requireApproval).toBe(true);
    expect(session.expiresAt).toBeGreaterThan(Date.now() + 19 * 60 * 1000);
    expect(session.receiver.name).toBe("Test MacBook");
    expect(session.receiver.isOnline).toBe(true);
    expect(session.sender).toBeNull();
  });

  it("pairs multiple sender devices when joining an existing beam session", async () => {
    const session = await createBeamSession("Receiver PC");
    const joined1 = await joinBeamSession(session.code, "Sender iPhone");
    expect(joined1.status).toBe("paired");
    expect(joined1.sender?.name).toBe("Sender iPhone");

    const joined2 = await joinBeamSession(session.code, "Sender iPad");
    expect(joined2.senders).toBeDefined();
  });

  it("sends transfer items with unique timestamped IDs and approval status", async () => {
    const session = await createBeamSession("Receiver PC", 15, true);
    await joinBeamSession(session.code, "Sender Phone");

    const transfer = await sendBeamTransfer(session.code, {
      senderId: "test-dev-1",
      senderName: "Sender Phone",
      type: "text",
      textContent: "Hello via Live QR Beam!",
    });

    expect(transfer.id).toMatch(/^tx-/);
    expect(transfer.type).toBe("text");
    expect(transfer.textContent).toBe("Hello via Live QR Beam!");
    expect(transfer.status).toBe("pending");
  });

  it("handles transfer approval and decline status updates", async () => {
    const session = await createBeamSession("Receiver PC", 15, true);
    await joinBeamSession(session.code, "Sender Phone");

    const transfer = await sendBeamTransfer(session.code, {
      senderId: "test-dev-1",
      senderName: "Sender Phone",
      type: "voice",
      note: "Voice Memo",
    });

    await updateTransferApprovalStatus(session.code, transfer.id, "accepted");
    const raw = localStorage.getItem(`livetalk_beam_session_${session.code}`);
    const updated = JSON.parse(raw!);
    expect(updated.transfers[transfer.id].status).toBe("accepted");
  });

  it("extends beam session expiration time", async () => {
    const session = await createBeamSession("Receiver PC", 10);
    const originalExp = session.expiresAt;

    const newExp = await extendBeamSession(session.code, 15);
    expect(newExp).toBeGreaterThan(originalExp);
  });

  it("toggles session approval mode", async () => {
    const session = await createBeamSession("Receiver PC", 15, false);
    expect(session.requireApproval).toBe(false);

    await toggleSessionApproval(session.code, true);
    const raw = localStorage.getItem(`livetalk_beam_session_${session.code}`);
    const updated = JSON.parse(raw!);
    expect(updated.requireApproval).toBe(true);
  });

  it("throws clear error when attempting to join non-existent session", async () => {
    await expect(joinBeamSession("ZZZZ")).rejects.toThrow(/not found or expired/);
  });
});
