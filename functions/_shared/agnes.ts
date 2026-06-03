import { buildChatCompletionPayload, buildImageGenerationPayload, buildVideoCreationPayload, normalizeProviderError, normalizeVideoTask, type ImageGenerationInput, type VideoCreationInput } from "./provider";

const API_BASE = "https://apihub.agnes-ai.com/v1";

export interface AgnesClientOptions {
  apiKey: string;
  fetcher?: typeof fetch;
}

export class AgnesClient {
  private readonly apiKey: string;
  private readonly fetcher: typeof fetch;

  constructor(options: AgnesClientOptions) {
    this.apiKey = options.apiKey;
    this.fetcher = options.fetcher ?? ((input, init) => fetch(input, init));
  }

  async chat(messages: { role: "user" | "assistant"; content: string }[], options?: { signal?: AbortSignal }) {
    return this.post("/chat/completions", buildChatCompletionPayload(messages, true), options);
  }

  async image(input: ImageGenerationInput) {
    const response = await this.post("/images/generations", buildImageGenerationPayload(input));
    const body = await response.json<{ data?: { url?: string }[] }>();
    const url = body.data?.[0]?.url;
    if (!url) throw new Error("IMAGE_URL_MISSING");
    return url;
  }

  async createVideo(input: VideoCreationInput) {
    const response = await this.post("/videos", buildVideoCreationPayload(input));
    return response.json<{ id: string; status: string; progress?: number }>();
  }

  async readVideo(taskId: string) {
    const response = await this.request(`/videos/${encodeURIComponent(taskId)}`, { method: "GET" });
    return normalizeVideoTask(await response.json<{ id: string; status: string; progress?: number; video_url?: string; remixed_from_video_id?: string; url?: string }>());
  }

  async fetchRemote(url: string) {
    const response = await this.fetcher(url);
    if (!response.ok || !response.body) throw new Error("REMOTE_ASSET_FETCH_FAILED");
    return response;
  }

  private post(path: string, body: unknown, options?: { signal?: AbortSignal }) {
    return this.request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: options?.signal,
    });
  }

  private async request(path: string, init: RequestInit) {
    const response = await this.fetcher(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        ...(init.headers || {}),
      },
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(normalizeProviderError(response.status, text));
    }
    return response;
  }
}
