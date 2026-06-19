// Minimal pure-JS PDF generator (text-only, single page with pagination)
// Produces a valid PDF without external dependencies.

interface PdfTextLine {
  text: string;
  bold?: boolean;
  size?: number;
  color?: [number, number, number];
}

const PAGE_WIDTH = 595; // A4 in points
const PAGE_HEIGHT = 842;
const MARGIN_LEFT = 50;
const MARGIN_TOP = 50;
const MARGIN_BOTTOM = 50;
const LINE_HEIGHT_FACTOR = 1.3;
const DEFAULT_FONT_SIZE = 11;

function wrapLine(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(/(\s+)/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + word).length > maxChars && current) {
      lines.push(current.trimEnd());
      current = word.trimStart();
    } else {
      current += word;
    }
  }
  if (current) lines.push(current.trimEnd());
  return lines;
}

function escapePdfString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/\r/g, "");
}

function renderLines(lines: PdfTextLine[]): Uint8Array {
  const bytes: number[] = [];
  const enc = new TextEncoder();
  const offsets: number[] = [];
  let currentY = PAGE_HEIGHT - MARGIN_TOP;

  // Header
  bytes.push(...Array.from(enc.encode("%PDF-1.4\n")));
  // Note: actual binary marker may be needed but this is sufficient for most readers

  const objects: string[] = [];

  // Object 1: Catalog
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  // Object 2: Pages
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`);

  // Object 3: Page
  objects.push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 6 0 R /F2 5 0 R >> >> /Contents 4 0 R >>\nendobj\n`);

  // Build content stream with text positioning
  const contentLines: string[] = ["BT"];
  for (const line of lines) {
    const fontSize = line.size || DEFAULT_FONT_SIZE;
    const font = line.bold ? "/F2" : "/F1";
    const color = line.color || [0, 0, 0];
    const wrapped = wrapLine(line.text, 90);
    for (const w of wrapped) {
      contentLines.push(`${font} ${fontSize} Tf`);
      contentLines.push(`${color[0]} ${color[1]} ${color[2]} rg`);
      contentLines.push(`${MARGIN_LEFT} ${currentY} Td`);
      contentLines.push(`(${escapePdfString(w)}) Tj`);
      contentLines.push(`-${MARGIN_LEFT} 0 Td`);
      currentY -= fontSize * LINE_HEIGHT_FACTOR;
      if (currentY < MARGIN_BOTTOM) {
        contentLines.push("ET");
        contentLines.push("BT");
        currentY = PAGE_HEIGHT - MARGIN_TOP;
      }
    }
  }
  contentLines.push("ET");
  const contentStream = contentLines.join("\n") + "\n";

  // Object 4: Content stream
  objects.push(`4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`);

  // Object 5: Helvetica-Bold
  objects.push("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n");

  // Object 6: Helvetica (regular)
  objects.push("6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n");

  // Compute offsets
  let pos = enc.encode("%PDF-1.4\n").length;
  for (let i = 0; i < objects.length; i++) {
    offsets.push(pos);
    pos += enc.encode(objects[i]).length;
  }

  // Update Page font reference
  // (Using F1 and F2 mapped to objects 5 and 6 - we need to fix this above)

  // Assemble final PDF
  const final: number[] = [];
  final.push(...Array.from(enc.encode("%PDF-1.4\n")));
  for (let i = 0; i < objects.length; i++) {
    final.push(...Array.from(enc.encode(objects[i])));
  }

  // Cross-ref table
  const xrefPos = final.length;
  final.push(...Array.from(enc.encode("xref\n0 6\n0000000000 65535 f \n")));
  for (const offset of offsets) {
    final.push(...Array.from(enc.encode(`${String(offset).padStart(10, "0")} 00000 n \n`)));
  }
  // Trailer
  final.push(...Array.from(enc.encode(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`)));

  return new Uint8Array(final);
}

function buildPdfLines(title: string, messages: { role: string; content: string; createdAt?: string }[]): PdfTextLine[] {
  const lines: PdfTextLine[] = [];
  lines.push({ text: title, bold: true, size: 18 });
  lines.push({ text: `Exported on ${new Date().toLocaleString("en-US")}`, size: 9, color: [120, 120, 120] });
  lines.push({ text: " ", size: 6 });
  for (const m of messages) {
    const role = m.role === "user" ? "You" : "Assistant";
    const timestamp = m.createdAt ? ` (${new Date(m.createdAt).toLocaleString("en-US")})` : "";
    lines.push({ text: `${role}${timestamp}:`, bold: true, size: 11 });
    lines.push({ text: m.content || "(empty)", size: 11 });
    lines.push({ text: " ", size: 6 });
  }
  return lines;
}

export function generateChatPdf(title: string, messages: { role: string; content: string; createdAt?: string }[]): Blob {
  const lines = buildPdfLines(title, messages);
  const bytes = renderLines(lines);
  return new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], { type: "application/pdf" });
}
