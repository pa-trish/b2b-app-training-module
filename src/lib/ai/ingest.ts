import mammoth from "mammoth";
import { readStoredFile } from "@/lib/storage/files";

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const lower = fileName.toLowerCase();

  if (mimeType === "text/plain" || mimeType === "text/markdown" || lower.endsWith(".txt") || lower.endsWith(".md")) {
    return buffer.toString("utf-8");
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    const pdfParseModule = await import("pdf-parse");
    const pdfParse =
      "default" in pdfParseModule
        ? (pdfParseModule.default as (buf: Buffer) => Promise<{ text: string }>)
        : (pdfParseModule as unknown as (buf: Buffer) => Promise<{ text: string }>);
    const result = await pdfParse(buffer);
    return result.text;
  }

  throw new Error(`Unsupported file type: ${mimeType || fileName}`);
}

export async function extractTextFromStorage(
  storageKey: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  const buffer = await readStoredFile(storageKey);
  return extractTextFromBuffer(buffer, mimeType, fileName);
}
