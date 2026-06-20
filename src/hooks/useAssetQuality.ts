type QualityLevel = "high" | "medium" | "low";

type QualityResult = {
  level: QualityLevel;
  score: number;
  suggestions: string[];
};

function analyzeAssetQuality(asset: { kind: string; size: number; mediaType: string; width?: number; height?: number }): QualityResult {
  const suggestions: string[] = [];
  let score = 100;

  if (asset.kind === "image") {
    const pixels = (asset.width || 0) * (asset.height || 0);
    if (pixels < 500000) {
      score -= 30;
      suggestions.push("分辨率较低，建议使用更高分辨率的图片");
    } else if (pixels > 8000000) {
      suggestions.push("高分辨率图片，适合打印");
    }

    const sizeKB = asset.size / 1024;
    if (sizeKB > 5000) {
      score -= 15;
      suggestions.push("文件较大，可考虑压缩");
    } else if (sizeKB < 50) {
      score -= 10;
      suggestions.push("文件较小，可能影响质量");
    }

    if (asset.mediaType === "image/jpeg") {
      suggestions.push("JPEG格式，适合照片");
    } else if (asset.mediaType === "image/png") {
      suggestions.push("PNG格式，适合图标和透明背景");
    } else if (asset.mediaType === "image/webp") {
      suggestions.push("WebP格式，压缩率高");
    }
  } else if (asset.kind === "video") {
    const sizeMB = asset.size / (1024 * 1024);
    if (sizeMB > 100) {
      score -= 20;
      suggestions.push("视频文件较大，建议压缩");
    }

    if (asset.mediaType === "video/mp4") {
      suggestions.push("MP4格式，兼容性好");
    }
  }

  let level: QualityLevel = "high";
  if (score < 60) level = "low";
  else if (score < 80) level = "medium";

  return { level, score, suggestions };
}

export { analyzeAssetQuality, type QualityResult, type QualityLevel };
