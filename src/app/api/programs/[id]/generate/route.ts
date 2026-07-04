import { getAuthAdapter } from "@/lib/auth/stub";
import { apiError, jsonOk } from "@/lib/api/helpers";
import {
  DEFAULT_AI_PROVIDER,
  isAIProviderId,
  resolveAIModel,
} from "@/lib/ai/models";
import { prisma } from "@/lib/db";
import { runPlanGeneration } from "@/lib/ai/persist-plan";

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

    const body = await request.json().catch(() => ({}));
    const aiProvider =
      typeof body.aiProvider === "string" && isAIProviderId(body.aiProvider)
        ? body.aiProvider
        : DEFAULT_AI_PROVIDER;

    await prisma.trainingProgram.update({
      where: { id },
      data: {
        generationStatus: "PENDING",
        generationProgress: 0,
        status: "GENERATING",
      },
    });

    runPlanGeneration(id, { aiProvider }).catch(() => undefined);

    return jsonOk({
      status: "started",
      aiProvider,
      model: resolveAIModel(aiProvider),
    });
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
