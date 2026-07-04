import { getAuthAdapter } from "@/lib/auth/stub";
import { apiError, jsonOk } from "@/lib/api/helpers";
import { getModuleDetail } from "@/lib/training/queries";
import { prisma } from "@/lib/db";
import { requireActiveEnrollment } from "@/lib/training/enrollment";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthAdapter();
    const session = await auth.getSession();
    if (!session) {
      return jsonOk({ error: "Unauthorized" }, 401);
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get("enrollmentId");

    if (!enrollmentId) {
      return jsonOk({ error: "enrollmentId required" }, 400);
    }

    let traineeId = session.userId;
    if (session.role === "manager") {
      const enrollment = await prisma.enrollment.findFirst({
        where: { id: enrollmentId, program: { managerId: session.userId } },
      });
      if (!enrollment) {
        return jsonOk({ error: "Not found" }, 404);
      }
      traineeId = enrollment.traineeId;
    } else {
      await auth.requireTrainee();
      await requireActiveEnrollment(enrollmentId, session.userId);
    }

    const detail = await getModuleDetail(id, enrollmentId, traineeId);
    if (!detail) {
      return jsonOk({ error: "Not found" }, 404);
    }

    return jsonOk(detail);
  } catch (error) {
    return apiError(error);
  }
}
