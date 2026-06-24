interface SmartFilenameOptions {
  title: string;
  format: string;
  date?: Date;
  prefix?: string;
  suffix?: string;
  maxLength?: number;
}

function sanitizeFilename(str: string): string {
  return str
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export function generateSmartFilename(options: SmartFilenameOptions): string {
  const {
    title,
    format,
    date = new Date(),
    prefix = "",
    suffix = "",
    maxLength = 100,
  } = options;

  const dateStr = date.toISOString().slice(0, 10);
  const timeStr = date.toTimeString().slice(0, 5).replace(":", "");
  const timestamp = `${dateStr}_${timeStr}`;

  const parts: string[] = [];
  if (prefix) parts.push(sanitizeFilename(prefix));
  parts.push(sanitizeFilename(title));
  parts.push(timestamp);
  if (suffix) parts.push(sanitizeFilename(suffix));

  let filename = parts.join("_");

  const ext = format === "pdf" ? ".pdf" : format === "html" ? ".html" : format === "text" ? ".txt" : ".md";
  const maxBaseLength = maxLength - ext.length;

  if (filename.length > maxBaseLength) {
    filename = filename.slice(0, maxBaseLength);
  }

  return filename + ext;
}

export function generateExportFilename(
  title: string,
  format: string,
  type: "full" | "selection" | "filtered" = "full"
): string {
  const suffix = type === "selection" ? "selection" : type === "filtered" ? "filtered" : "";
  return generateSmartFilename({
    title,
    format,
    suffix,
  });
}
