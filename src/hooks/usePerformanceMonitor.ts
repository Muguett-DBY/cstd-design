import { useCallback, useState } from "react";

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  memoryUsage: number | null;
  longTasks: number;
}

function getInitialMetrics(): PerformanceMetrics {
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
  const paintEntries = performance.getEntriesByType("paint");
  const fp = paintEntries.find((entry) => entry.name === "first-paint");

  let memoryUsage: number | null = null;
  if ("memory" in performance) {
    memoryUsage = (performance as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize;
  }

  return {
    loadTime: nav ? nav.loadEventEnd - nav.startTime : 0,
    domContentLoaded: nav ? nav.domContentLoadedEventEnd - nav.startTime : 0,
    firstPaint: fp ? fp.startTime : 0,
    memoryUsage,
    longTasks: 0,
  };
}

export function usePerformanceMonitor() {
  const [metrics] = useState<PerformanceMetrics>(getInitialMetrics);

  const measure = useCallback((name: string, fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    performance.measure(name, { start, end });
  }, []);

  return { metrics, measure };
}
