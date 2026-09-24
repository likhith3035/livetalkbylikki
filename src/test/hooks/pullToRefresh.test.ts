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

  it("should not trigger pull when ancestor scroll container is scrolled down (e.g. user scrolling or page upping)", () => {
    const scrollContainer = document.createElement("div");
    scrollContainer.className = "overflow-y-auto";
    scrollContainer.scrollTop = 150; // User is scrolled down into page

    const contentChild = document.createElement("div");
    scrollContainer.appendChild(contentChild);
    document.body.appendChild(scrollContainer);

    const onRefresh = vi.fn();
    const { result } = renderHook(() => usePullToRefresh({ onRefresh }));

    // User touches screen and drags down to scroll back up ("page upping")
    const touchStartEvent = new TouchEvent("touchstart", {
      touches: [{ clientY: 200, clientX: 100, target: contentChild } as any],
    });
    Object.defineProperty(touchStartEvent, "target", { value: contentChild });
    window.dispatchEvent(touchStartEvent);

    const touchMoveEvent = new TouchEvent("touchmove", {
      touches: [{ clientY: 350, clientX: 100 } as any],
    });
    Object.defineProperty(touchMoveEvent, "target", { value: contentChild });
    window.dispatchEvent(touchMoveEvent);

    // Pull to refresh MUST NOT activate when scrolled down
    expect(result.current.pullDistance).toBe(0);
    expect(result.current.isRefreshing).toBe(false);

    document.body.removeChild(scrollContainer);
  });

  it("should not trigger pull on interactive game or chat routes", () => {
    // Mock location pathname to /games
    const originalPathname = window.location.pathname;
    window.history.pushState({}, "", "/games");

    const onRefresh = vi.fn();
    const { result } = renderHook(() => usePullToRefresh({ onRefresh }));

    const touchStartEvent = new TouchEvent("touchstart", {
      touches: [{ clientY: 50, clientX: 100 } as any],
    });
    window.dispatchEvent(touchStartEvent);

    const touchMoveEvent = new TouchEvent("touchmove", {
      touches: [{ clientY: 250, clientX: 100 } as any],
    });
    window.dispatchEvent(touchMoveEvent);

    expect(result.current.pullDistance).toBe(0);

    window.history.pushState({}, "", originalPathname);
  });

  it("should not trigger pull on predominantly horizontal swipe gestures", () => {
    const onRefresh = vi.fn();
    const { result } = renderHook(() => usePullToRefresh({ onRefresh }));

    const touchStartEvent = new TouchEvent("touchstart", {
      touches: [{ clientY: 100, clientX: 50 } as any],
    });
    window.dispatchEvent(touchStartEvent);

    // Horizontal swipe (diffX = 200, diffY = 25)
    const touchMoveEvent = new TouchEvent("touchmove", {
      touches: [{ clientY: 125, clientX: 250 } as any],
    });
    window.dispatchEvent(touchMoveEvent);

    expect(result.current.pullDistance).toBe(0);
  });
});
