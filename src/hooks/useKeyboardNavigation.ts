import { useCallback, useEffect, useRef, useState } from "react";

interface UseKeyboardNavigationOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  itemSelector?: string;
  onSelect?: (item: HTMLElement, index: number) => void;
  onActivate?: (item: HTMLElement, index: number) => void;
  loop?: boolean;
}

export function useKeyboardNavigation({
  containerRef,
  itemSelector = "[role='option'], button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
  onSelect,
  onActivate,
  loop = true,
}: UseKeyboardNavigationOptions) {
  const [focusIndex, setFocusIndex] = useState(-1);
  const focusIndexRef = useRef(-1);

  const getItems = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.querySelectorAll<HTMLElement>(itemSelector));
  }, [containerRef, itemSelector]);

  const focusItem = useCallback((index: number) => {
    const items = getItems();
    if (items.length === 0) return;

    let targetIndex: number;
    if (loop) {
      targetIndex = ((index % items.length) + items.length) % items.length;
    } else {
      targetIndex = Math.max(0, Math.min(index, items.length - 1));
    }

    focusIndexRef.current = targetIndex;
    setFocusIndex(targetIndex);
    items[targetIndex]?.focus();
    onSelect?.(items[targetIndex], targetIndex);
  }, [getItems, loop, onSelect]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent | KeyboardEvent) => {
    const items = getItems();
    if (items.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight": {
        event.preventDefault();
        const nextIndex = focusIndexRef.current + 1;
        focusItem(nextIndex);
        break;
      }
      case "ArrowUp":
      case "ArrowLeft": {
        event.preventDefault();
        const prevIndex = focusIndexRef.current - 1;
        focusItem(prevIndex);
        break;
      }
      case "Home": {
        event.preventDefault();
        focusItem(0);
        break;
      }
      case "End": {
        event.preventDefault();
        focusItem(items.length - 1);
        break;
      }
      case "Enter":
      case " ": {
        event.preventDefault();
        const currentIndex = focusIndexRef.current;
        if (currentIndex >= 0 && currentIndex < items.length) {
          onActivate?.(items[currentIndex], currentIndex);
        }
        break;
      }
    }
  }, [getItems, focusItem, onActivate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [containerRef, handleKeyDown]);

  return { focusItem, focusIndex };
}
