import { getAuthAdapter } from "@/lib/auth/stub";
import { apiError, jsonOk } from "@/lib/api/helpers";
import { getEnrollmentLogs } from "@/lib/training/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const manager = await getAuthAdapter().requireManager();
    const { id } = await params;
    const enrollment = await getEnrollmentLogs(id, manager.id);

    if (!enrollment) {
      return jsonOk({ error: "Not found" }, 404);
    }

    return jsonOk({ enrollment });
  } catch (error) {
    return apiError(error);
  }
}
