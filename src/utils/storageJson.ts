export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function parseStoredJson<T>(
  raw: string | null,
  fallback: T,
  guard: (value: unknown) => value is T,
): T {
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    return guard(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}
