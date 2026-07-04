import { getAuthAdapter } from "@/lib/auth/stub";
import { apiError, jsonOk } from "@/lib/api/helpers";
import { updateEnrollmentStatus } from "@/lib/training/enrollment";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; enrollmentId: string }> }
) {
  try {
    const manager = await getAuthAdapter().requireManager();
    const { id, enrollmentId } = await params;
    const body = await request.json();
    const action = String(body.action || "");

    if (action !== "complete" && action !== "remove") {
      return jsonOk({ error: "Invalid action. Use complete or remove." }, 400);
    }

    const enrollment = await updateEnrollmentStatus({
      programId: id,
      enrollmentId,
      managerId: manager.id,
      status: action === "complete" ? "COMPLETED" : "REMOVED",
    });

    return jsonOk({ enrollment });
  } catch (error) {
    return apiError(error);
  }
}
