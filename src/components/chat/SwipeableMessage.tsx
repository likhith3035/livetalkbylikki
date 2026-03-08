import { useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";

interface SwipeableMessageProps {
  children: ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  isMine: boolean;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 60;

const SwipeableMessage = ({
  children,
  onSwipeRight,
  onSwipeLeft,
  isMine,
  disabled,
}: SwipeableMessageProps) => {
  const x = useMotionValue(0);
  const [swiping, setSwiping] = useState(false);

  const rightOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const leftOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const rightScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.5, 1.2]);
  const leftScale = useTransform(x, [-SWIPE_THRESHOLD, 0], [1.2, 0.5]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setSwiping(false);
    if (info.offset.x > SWIPE_THRESHOLD && onSwipeRight) {
      onSwipeRight();
    } else if (info.offset.x < -SWIPE_THRESHOLD && onSwipeLeft) {
      onSwipeLeft();
    }
  };

  if (disabled) return <>{children}</>;

  return (
    <div className="relative overflow-visible">
      {/* Left hint (swipe right → react) */}
      {!isMine && onSwipeRight && (
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 pointer-events-none"
          style={{ opacity: rightOpacity, scale: rightScale }}
        >
          <span className="text-lg">❤️</span>
        </motion.div>
      )}

      {/* Right hint (swipe left → reply) */}
      {onSwipeLeft && (
        <motion.div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 pointer-events-none",
            isMine ? "right-0 translate-x-2" : "right-0 translate-x-2"
          )}
          style={{ opacity: leftOpacity, scale: leftScale }}
        >
          <span className="text-xs text-primary font-medium">↩ Reply</span>
        </motion.div>
      )}

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDragStart={() => setSwiping(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={cn("touch-pan-y", swiping && "cursor-grabbing")}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default SwipeableMessage;
