import { getAuthAdapter } from "@/lib/auth/stub";
import { apiError, jsonOk } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";
import { saveUploadedFile } from "@/lib/storage/files";
import { extractTextFromBuffer } from "@/lib/ai/ingest";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const manager = await getAuthAdapter().requireManager();
    const { id } = await params;

    const program = await prisma.trainingProgram.findFirst({
      where: { id, managerId: manager.id },
    });
    if (!program) {
      return jsonOk({ error: "Not found" }, 404);
    }

    const formData = await request.formData();
    const files = formData.getAll("files");

    const uploaded = [];

    for (const entry of files) {
      if (!(entry instanceof File)) continue;

      const buffer = Buffer.from(await entry.arrayBuffer());
      const storageKey = await saveUploadedFile(id, entry.name, buffer);

      let extractedText: string | null = null;
      let parseStatus: "COMPLETED" | "FAILED" = "COMPLETED";

      try {
        extractedText = await extractTextFromBuffer(buffer, entry.type, entry.name);
        if (!extractedText.trim()) {
          extractedText = null;
          parseStatus = "FAILED";
        }
      } catch {
        extractedText = null;
        parseStatus = "FAILED";
      }

      const doc = await prisma.document.create({
        data: {
          programId: id,
          fileName: entry.name,
          mimeType: entry.type || "application/octet-stream",
          storageKey,
          extractedText,
          parseStatus,
        },
      });

      uploaded.push({ ...doc, wordCount: extractedText ? extractedText.trim().split(/\s+/).length : 0 });
    }

    const totalWords = uploaded.reduce((sum, doc) => sum + (doc.wordCount ?? 0), 0);

    return jsonOk({ documents: uploaded, stats: { totalWords } }, 201);
  } catch (error) {
    return apiError(error);
  }
}
