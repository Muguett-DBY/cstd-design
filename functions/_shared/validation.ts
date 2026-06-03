import { z } from "zod";

const uuid = z.string().uuid();
const title = z.string().trim().min(1).max(80);
const prompt = z.string().trim().min(1).max(8_000);

export const LoginRequestSchema = z.object({
  password: z.string().min(1).max(256),
}).strict();

export const CreateConversationSchema = z.object({
  title: title.optional(),
}).strict();

export const UpdateConversationSchema = z.object({
  title: title.optional(),
  activeLeafId: uuid.optional(),
}).strict();

export const ChatRequestSchema = z.object({
  conversationId: uuid.optional(),
  parentId: uuid.nullable().optional(),
  content: prompt,
}).strict();

export const ImageRequestSchema = z.object({
  prompt,
  size: z.enum(["1024x1024", "1024x768", "768x1024"]).default("1024x1024"),
  referenceAssetIds: z.array(uuid).max(4).default([]),
}).strict();

export const VideoRequestSchema = z.object({
  prompt,
  preset: z.enum(["short", "standard", "max"]).default("standard"),
  fps: z.number().int().min(1).max(60).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  negativePrompt: z.string().trim().max(2_000).optional(),
  seed: z.number().int().optional(),
  referenceAssetIds: z.array(uuid).max(4).default([]),
  keyframes: z.boolean().default(false),
}).strict().refine(
  (value) => {
    if (value.width === undefined && value.height === undefined) return true;
    return (value.width === 1152 && value.height === 768) || (value.width === 768 && value.height === 1152);
  },
  { message: "unsupported video size" },
);

export function parseRequest<T>(schema: z.ZodType<T>, input: unknown) {
  const parsed = schema.safeParse(input);
  return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: "请求参数无效，请检查后重试。" };
}
