import { useState, useEffect, useRef } from "react";

interface UsePullToRefreshOptions {
  onRefresh?: () => Promise<void> | void;
  threshold?: number;
  maxPull?: number;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions = {}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  useEffect(() => {
    // Determine if the touch began inside an element that should never trigger pull-to-refresh
    const isExcludedTarget = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;

      return Boolean(
        target.closest(
          'video, audio, canvas, input, textarea, button, [data-no-pull-refresh], [data-video-call-active], [data-pip-container], [data-pip], .touch-none, [role="dialog"], [role="menu"]'
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

      // 2. In an active chat session or room where a reload destroys peer connections
      const path = typeof window !== "undefined" ? window.location.pathname : "";
      if (path.includes("/chat") || path.includes("/room")) {
        return true;
      }

      return false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      // Only proceed if at the very top of document and NOT in a protected/excluded context
      if (window.scrollY <= 2 && !isExcludedContext() && !isExcludedTarget(e.target)) {
        touchStartY.current = e.touches[0].clientY;
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

      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartY.current;

      if (diff > 0 && window.scrollY <= 2) {
        // Damped pull effect
        const distance = Math.min(diff * 0.5, maxPull);
        setPullDistance(distance);

        // Prevent default browser overscroll when pulling down on allowed pages
        if (distance > 10 && e.cancelable) {
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

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, threshold, maxPull, onRefresh]);

  return { pullDistance, isRefreshing, threshold };
};
