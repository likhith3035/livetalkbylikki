import { useState, useEffect, useRef } from "react";

interface UsePullToRefreshOptions {
  onRefresh?: () => Promise<void> | void;
  threshold?: number;
  maxPull?: number;
}

/**
 * Checks if the target element or any of its scrollable ancestors is currently scrolled down.
 * If ANY container has scrollTop > 3, the user is scrolling content (e.g. paging up/down),
 * so pull-to-refresh must NEVER be triggered.
 */
const isContainerScrolledDown = (target: EventTarget | null): boolean => {
  if (typeof window === "undefined") return false;

  // 1. Check window/document scroll position
  const winScroll =
    window.scrollY ||
    document.documentElement?.scrollTop ||
    document.body?.scrollTop ||
    0;
  if (winScroll > 3) return true;

  // 2. Check touch target and all ancestor elements
  let el = target instanceof HTMLElement ? target : null;
  while (el && el !== document.body && el !== document.documentElement) {
    if (el.scrollTop > 3) {
      return true;
    }
    el = el.parentElement;
  }

  // 3. Check common application scroll containers (e.g. AppShell content wrapper)
  try {
    const scrollContainers = document.querySelectorAll<HTMLElement>(
      "#app-shell-scroll-container, [data-scroll-container], .overflow-y-auto, .overflow-y-scroll"
    );
    for (let i = 0; i < scrollContainers.length; i++) {
      const container = scrollContainers[i];
      if (
        target instanceof Node &&
        container.contains(target) &&
        container.scrollTop > 3
      ) {
        return true;
      }
    }
  } catch {
    // Ignore any selector issues
  }

  return false;
};

export const usePullToRefresh = ({
  onRefresh,
  threshold = 60,
  maxPull = 110,
}: UsePullToRefreshOptions = {}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const isPulling = useRef(false);

  useEffect(() => {
    // Determine if the touch began inside an element that should never trigger pull-to-refresh
    const isExcludedTarget = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;

      return Boolean(
        target.closest(
          'video, audio, canvas, input, textarea, select, [data-no-pull-refresh], [data-video-call-active], [data-pip-container], [data-pip], [role="dialog"], [role="menu"], pre, code'
        )
      );
    };

    // Determine if the current screen or session context should forbid pull-to-refresh
    const isExcludedContext = (): boolean => {
      // 1. In an active video/audio call
      if (
        (typeof window !== "undefined" && (window as any).__LIVETALK_CALL_ACTIVE__) ||
        document.body.classList.contains("in-video-call") ||
        document.querySelector("[data-video-call-active]")
      ) {
        return true;
      }

      // 2. In active room matches or active peer connections where a reload forfeits the match or destroys connection
      const path = typeof window !== "undefined" ? window.location.pathname : "";
      const search = typeof window !== "undefined" ? window.location.search : "";

      if (
        path.includes("/room/") ||
        path.startsWith("/games/") ||
        search.includes("room=") ||
        document.querySelector("[data-game-active='true']") ||
        document.body.classList.contains("in-chat-connected") ||
        document.querySelector("[data-chat-connected='true']")
      ) {
        return true;
      }

      return false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      // If we are in an excluded context or target, or any container is scrolled down, NEVER pull
      if (isExcludedContext() || isExcludedTarget(e.target) || isContainerScrolledDown(e.target)) {
        isPulling.current = false;
        return;
      }

      if (e.touches && e.touches.length === 1) {
        touchStartY.current = e.touches[0].clientY ?? 0;
        touchStartX.current = e.touches[0].clientX ?? 0;
        isPulling.current = true;
      } else {
        isPulling.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing || isExcludedContext()) {
        if (pullDistance > 0) setPullDistance(0);
        isPulling.current = false;
        return;
      }

      // If user has scrolled down anywhere, immediately abort pull-to-refresh
      if (isContainerScrolledDown(e.target)) {
        if (pullDistance > 0) setPullDistance(0);
        isPulling.current = false;
        return;
      }

      const touch = e.touches[0];
      const currentY = touch.clientY ?? 0;
      const currentX = touch.clientX ?? 0;

      const diffY = currentY - touchStartY.current;
      const diffX = Math.abs(currentX - touchStartX.current);

      // If horizontal swiping is greater than vertical, user is swiping horizontally — abort
      if (diffX > Math.abs(diffY)) {
        if (pullDistance > 0) setPullDistance(0);
        isPulling.current = false;
        return;
      }

      // Only pull if swiping downwards from the true top
      // 10px dead-zone so subtle taps don't initiate pull
      if (diffY > 10) {
        const effectivePull = diffY - 10;
        // Damped pull effect (0.55 factor)
        const distance = Math.min(effectivePull * 0.55, maxPull);
        setPullDistance(distance);

        // Prevent default browser bounce once an intentional pull is underway
        if (distance > 18 && e.cancelable) {
          e.preventDefault();
        }
      } else {
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;
      isPulling.current = false;

      // Final safety guard
      if (isExcludedContext()) {
        setPullDistance(0);
        return;
      }

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(threshold);

        try {
          if (onRefresh) {
            await onRefresh();
          } else {
            // Default action: reload page only on static / informational views
            window.location.reload();
          }
        } catch (e) {
          console.error("Error during pull to refresh:", e);
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          }, 600);
        }
      } else {
        setPullDistance(0);
      }
    };

    const handleTouchCancel = () => {
      isPulling.current = false;
      setPullDistance(0);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchCancel);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [pullDistance, isRefreshing, threshold, maxPull, onRefresh]);

  return { pullDistance, isRefreshing, threshold };
};
