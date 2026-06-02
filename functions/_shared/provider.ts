export type ImageSize = "1024x1024" | "1024x768" | "768x1024";
export type VideoPreset = "short" | "standard" | "max";

export interface ImageGenerationInput {
  prompt: string;
  size: ImageSize;
  referenceUrls?: string[];
}

export interface VideoCreationInput {
  prompt: string;
  preset: VideoPreset;
  fps?: number;
  width?: number;
  height?: number;
  image?: string;
  referenceUrls?: string[];
  negativePrompt?: string;
  seed?: number;
  keyframes?: boolean;
}

export function buildImageGenerationPayload(input: ImageGenerationInput) {
  const payload: Record<string, unknown> = {
    model: "agnes-image-2.1-flash",
    prompt: input.prompt,
    size: input.size,
  };
  if (input.referenceUrls?.length) {
    payload.extra_body = { image: input.referenceUrls, response_format: "url" };
  }
  return payload;
}

export function buildChatCompletionPayload(messages: { role: "user" | "assistant"; content: string }[], stream = true) {
  return {
    model: "agnes-2.0-flash",
    messages,
    stream,
  };
}

export function buildVideoCreationPayload(input: VideoCreationInput) {
  const framesByPreset: Record<VideoPreset, number> = { short: 121, standard: 241, max: 441 };
  const payload: Record<string, unknown> = {
    model: "agnes-video-v2.0",
    prompt: input.prompt,
    width: input.width ?? 1152,
    height: input.height ?? 768,
    num_frames: framesByPreset[input.preset],
    frame_rate: clamp(input.fps ?? 24, 1, 60),
  };
  if (input.image) payload.image = input.image;
  if (input.negativePrompt) payload.negative_prompt = input.negativePrompt;
  if (typeof input.seed === "number") payload.seed = input.seed;
  if (input.referenceUrls?.length) {
    payload.extra_body = { image: input.referenceUrls, ...(input.keyframes ? { mode: "keyframes" } : {}) };
  }
  return payload;
}

export function normalizeProviderError(status: number, body: string) {
  if (status === 401 || /unauthori[sz]ed|api key/i.test(body)) return "服务鉴权失败，请检查后台配置。";
  if (status === 400) return "请求参数无效，请调整后重试。";
  if (status === 404) return "任务不存在或已过期。";
  if (status === 429) return "请求过于频繁，请稍后重试。";
  if (status === 503) return "服务当前繁忙，请稍后重试。";
  return "服务暂时不可用，请稍后重试。";
}

export function normalizeVideoTask(raw: {
  id: string;
  status: string;
  progress?: number;
  video_url?: string;
  remixed_from_video_id?: string;
  url?: string;
}) {
  return {
    id: raw.id,
    status: raw.status as "queued" | "in_progress" | "completed" | "failed",
    progress: Math.max(0, Math.min(100, Number(raw.progress ?? 0))),
    videoUrl: raw.video_url || raw.remixed_from_video_id || raw.url,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
