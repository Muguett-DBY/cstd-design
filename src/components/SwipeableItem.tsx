import { useRef, useState, useCallback } from "react";
import { Trash2 } from "lucide-react";

interface SwipeableItemProps {
  children: React.ReactNode;
  onDelete?: () => void;
  deleteLabel?: string;
  swipeThreshold?: number;
}

export function SwipeableItem({
  children,
  onDelete,
  deleteLabel = "删除",
  swipeThreshold = 80,
}: SwipeableItemProps) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    currentXRef.current = e.touches[0].clientX;
    const diff = currentXRef.current - startXRef.current;
    if (diff < 0) {
      setOffset(Math.max(diff, -swipeThreshold));
    }
  }, [isDragging, swipeThreshold]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (offset < -swipeThreshold / 2 && onDelete) {
      onDelete();
    } else {
      setOffset(0);
    }
  }, [offset, swipeThreshold, onDelete]);

  if (!onDelete) {
    return <div className="swipeable-item">{children}</div>;
  }

  return (
    <div className="swipeable-item-wrapper" role="listitem" aria-label={deleteLabel}>
      <div
        className="swipeable-delete-bg"
        style={{ opacity: Math.abs(offset) / swipeThreshold }}
        aria-hidden="true"
      >
        <Trash2 size={16} />
        <span>{deleteLabel}</span>
      </div>
      <div
        className={`swipeable-item${isDragging ? " dragging" : ""}`}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
