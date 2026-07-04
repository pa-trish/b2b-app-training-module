import { getAuthAdapter } from "@/lib/auth/stub";
import { apiError, jsonOk } from "@/lib/api/helpers";
import { enrollTraineeInProgram } from "@/lib/training/enrollment";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const manager = await getAuthAdapter().requireManager();
    const { id } = await params;
    const body = await request.json();

    const traineeId = String(body.traineeId || "");
    if (!traineeId) {
      return jsonOk({ error: "traineeId is required" }, 400);
    }

    const startDate = body.startDate ? new Date(body.startDate) : new Date();

    const result = await enrollTraineeInProgram({
      programId: id,
      managerId: manager.id,
      traineeId,
      startDate,
    });

    return jsonOk(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
