import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

export async function saveUploadedFile(
  programId: string,
  fileName: string,
  buffer: Buffer
): Promise<string> {
  await ensureUploadDir();
  const programDir = path.join(UPLOAD_DIR, programId);
  await mkdir(programDir, { recursive: true });
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = path.join(programId, `${Date.now()}-${safeName}`);
  const fullPath = path.join(UPLOAD_DIR, storageKey);
  await writeFile(fullPath, buffer);
  return storageKey;
}

export async function readStoredFile(storageKey: string): Promise<Buffer> {
  const fullPath = path.join(UPLOAD_DIR, storageKey);
  return readFile(fullPath);
}

export function getUploadPath(storageKey: string): string {
  return path.join(UPLOAD_DIR, storageKey);
}
