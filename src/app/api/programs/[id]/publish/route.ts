import { getAuthAdapter } from "@/lib/auth/stub";
import { apiError, jsonOk } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const manager = await getAuthAdapter().requireManager();
    const { id } = await params;

    const program = await prisma.trainingProgram.findFirst({
      where: { id, managerId: manager.id },
      include: { days: true },
    });

    if (!program) {
      return jsonOk({ error: "Not found" }, 404);
    }

    if (program.days.length === 0) {
      return jsonOk({ error: "Generate a plan before publishing" }, 400);
    }

    await prisma.trainingProgram.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });

    return jsonOk({ status: "published" });
  } catch (error) {
    return apiError(error);
  }
}
