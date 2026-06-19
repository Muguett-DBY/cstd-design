export async function extractImageDimensions(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function extractVideoDuration(url: string): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = video.duration;
      video.src = "";
      resolve(Number.isFinite(duration) ? duration : null);
    };
    video.onerror = () => resolve(null);
    video.src = url;
  });
}

export function formatDimensions(width?: number, height?: number): string {
  if (!width || !height) return "";
  return `${width}×${height}`;
}

export function formatDuration(seconds?: number): string {
  if (!seconds || !Number.isFinite(seconds)) return "";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function getAssetMetadata(asset: { width?: number; height?: number; duration?: number; mediaType: string }) {
  const parts: string[] = [];
  if (asset.width && asset.height) {
    parts.push(formatDimensions(asset.width, asset.height));
  } else if (asset.mediaType.startsWith("video") && asset.duration) {
    parts.push(formatDuration(asset.duration));
  }
  return parts.join(" · ");
}
