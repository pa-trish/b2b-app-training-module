import { getAuthAdapter } from "@/lib/auth/stub";
import { apiError, jsonOk } from "@/lib/api/helpers";
import { getEnrollmentDashboard } from "@/lib/training/queries";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthAdapter();
    const session = await auth.getSession();
    if (!session) {
      return jsonOk({ error: "Unauthorized" }, 401);
    }

    const { id } = await params;

    let traineeId = session.userId;

    if (session.role === "manager") {
      const enrollment = await prisma.enrollment.findFirst({
        where: { id, program: { managerId: session.userId } },
      });
      if (!enrollment) {
        return jsonOk({ error: "Not found" }, 404);
      }
      traineeId = enrollment.traineeId;
    } else {
      await auth.requireTrainee();
    }

    const dashboard = await getEnrollmentDashboard(id, traineeId);
    if (!dashboard) {
      return jsonOk({ error: "Not found" }, 404);
    }

    return jsonOk(dashboard);
  } catch (error) {
    return apiError(error);
  }
}
