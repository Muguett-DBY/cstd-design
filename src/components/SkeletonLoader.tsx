interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  lines?: number;
}

export function SkeletonLoader({
  width = "100%",
  height = 20,
  borderRadius = "4px",
  className = "",
  lines = 1,
}: SkeletonLoaderProps) {
  if (lines > 1) {
    return (
      <div className={`skeleton-group ${className}`} aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className="skeleton-loader"
            style={{
              width: i === lines - 1 ? "60%" : width,
              height,
              borderRadius,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`skeleton-loader ${className}`}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <SkeletonLoader height={120} borderRadius="8px 8px 0 0" />
      <div className="skeleton-card-body">
        <SkeletonLoader width="70%" height={16} />
        <SkeletonLoader width="40%" height={12} />
      </div>
    </div>
  );
}

export function SkeletonMessage() {
  return (
    <div className="skeleton-message" aria-hidden="true">
      <SkeletonLoader width={36} height={36} borderRadius="50%" />
      <div className="skeleton-message-body">
        <SkeletonLoader width={100} height={12} />
        <SkeletonLoader lines={3} height={14} />
      </div>
    </div>
  );
}
