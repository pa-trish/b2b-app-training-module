import { getAuthAdapter } from "@/lib/auth/stub";
import { apiError, jsonOk } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";
import { runPlanGeneration } from "@/lib/ai/persist-plan";

export async function POST(
  _request: Request,
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

    await prisma.trainingProgram.update({
      where: { id },
      data: {
        generationStatus: "PENDING",
        generationProgress: 0,
        status: "GENERATING",
      },
    });

    runPlanGeneration(id).catch(() => undefined);

    return jsonOk({ status: "started" });
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const manager = await getAuthAdapter().requireManager();
    const { id } = await params;

    const program = await prisma.trainingProgram.findFirst({
      where: { id, managerId: manager.id },
      select: {
        generationStatus: true,
        generationProgress: true,
        generationError: true,
        status: true,
      },
    });

    if (!program) {
      return jsonOk({ error: "Not found" }, 404);
    }

    return jsonOk(program);
  } catch (error) {
    return apiError(error);
  }
}
