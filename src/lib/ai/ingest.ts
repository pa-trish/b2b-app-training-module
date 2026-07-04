import mammoth from "mammoth";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { readStoredFile } from "@/lib/storage/files";

let pdfWorkerConfigured = false;

function ensurePdfWorker(PDFParse: typeof import("pdf-parse").PDFParse) {
  if (pdfWorkerConfigured) return;

  const require = createRequire(`${process.cwd()}/package.json`);
  const workerPath = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
  PDFParse.setWorker(pathToFileURL(workerPath).href);
  pdfWorkerConfigured = true;
}

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
    const { PDFParse } = await import("pdf-parse");
    ensurePdfWorker(PDFParse);
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
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
