import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Reset standard window/body scrolling
    window.scrollTo(0, 0);

    // 2. Reset scrollable container divs (like the AppShell independent content area)
    const scrollContainers = document.querySelectorAll(".overflow-y-auto");
    scrollContainers.forEach((container) => {
      container.scrollTop = 0;
    });
  }, [pathname]);

  return null;
}
