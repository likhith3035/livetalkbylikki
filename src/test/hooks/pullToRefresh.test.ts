import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

describe("usePullToRefresh Hook Protection", () => {
  beforeEach(() => {
    document.body.className = "";
    (window as any).__LIVETALK_CALL_ACTIVE__ = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should not start pulling when in an active video call", () => {
    (window as any).__LIVETALK_CALL_ACTIVE__ = true;
    const onRefresh = vi.fn();
    const { result } = renderHook(() => usePullToRefresh({ onRefresh }));

    // Simulate touch start
    const touchStartEvent = new TouchEvent("touchstart", {
      touches: [{ clientY: 100 } as any],
    });
    window.dispatchEvent(touchStartEvent);

    // Simulate touch move downwards
    const touchMoveEvent = new TouchEvent("touchmove", {
      touches: [{ clientY: 300 } as any],
    });
    window.dispatchEvent(touchMoveEvent);

    expect(result.current.pullDistance).toBe(0);
    expect(result.current.isRefreshing).toBe(false);
  });

  it("should not trigger pull when touching a video or draggable element", () => {
    const videoEl = document.createElement("video");
    document.body.appendChild(videoEl);

    const onRefresh = vi.fn();
    const { result } = renderHook(() => usePullToRefresh({ onRefresh }));

    const touchStartEvent = new TouchEvent("touchstart", {
      touches: [{ clientY: 100, target: videoEl } as any],
    });
    Object.defineProperty(touchStartEvent, "target", { value: videoEl });
    window.dispatchEvent(touchStartEvent);

    const touchMoveEvent = new TouchEvent("touchmove", {
      touches: [{ clientY: 250 } as any],
    });
    window.dispatchEvent(touchMoveEvent);

    expect(result.current.pullDistance).toBe(0);

    document.body.removeChild(videoEl);
  });

  it("should not trigger pull when touching an element with data-no-pull-refresh", () => {
    const pipEl = document.createElement("div");
    pipEl.setAttribute("data-no-pull-refresh", "true");
    document.body.appendChild(pipEl);

    const onRefresh = vi.fn();
    const { result } = renderHook(() => usePullToRefresh({ onRefresh }));

    const touchStartEvent = new TouchEvent("touchstart", {
      touches: [{ clientY: 100, target: pipEl } as any],
    });
    Object.defineProperty(touchStartEvent, "target", { value: pipEl });
    window.dispatchEvent(touchStartEvent);

    const touchMoveEvent = new TouchEvent("touchmove", {
      touches: [{ clientY: 250 } as any],
    });
    window.dispatchEvent(touchMoveEvent);

    expect(result.current.pullDistance).toBe(0);

    document.body.removeChild(pipEl);
  });
});
