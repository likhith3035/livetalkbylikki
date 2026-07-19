import { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";

interface AnimatedCounterProps {
  value: string;
  duration?: number;
}

export const AnimatedCounter = ({ value, duration = 1.5 }: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;

    let targetNumber = 0;
    let suffix = "";
    let specialType: "percent" | "slash" | "infinity" | "simple" = "simple";

    if (value.includes("%")) {
      targetNumber = parseInt(value.replace("%", ""), 10);
      suffix = "%";
      specialType = "percent";
    } else if (value.includes("/7")) {
      targetNumber = parseInt(value.replace("/7", ""), 10);
      suffix = "/7";
      specialType = "slash";
    } else if (value === "∞") {
      targetNumber = 999;
      suffix = "∞";
      specialType = "infinity";
    } else {
      const parsed = parseInt(value, 10);
      if (isNaN(parsed)) {
        setDisplayValue(value);
        return;
      }
      targetNumber = parsed;
      if (targetNumber === 0) {
        setDisplayValue("0");
        return;
      }
    }

    let startTime: number | null = null;

    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Easing out function
      const easeOutQuad = (t: number) => t * (2 - t);
      const easedProgress = easeOutQuad(progress);
      
      const currentVal = Math.floor(easedProgress * targetNumber);

      if (specialType === "infinity") {
        if (progress < 1) {
          setDisplayValue(String(currentVal));
        } else {
          setDisplayValue("∞");
        }
      } else {
        setDisplayValue(`${currentVal}${suffix}`);
      }

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animateCount);
  }, [value, duration, isInView]);

  return (
    <span ref={ref} className="tabular-nums">
      {displayValue}
    </span>
  );
};
export default AnimatedCounter;
