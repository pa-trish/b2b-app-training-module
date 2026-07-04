import { getAuthAdapter } from "@/lib/auth/stub";
import { prisma } from "@/lib/db";
import { apiError, jsonOk } from "@/lib/api/helpers";
import { getEnrollmentDashboard } from "@/lib/training/queries";

export async function GET() {
  try {
    const auth = getAuthAdapter();
    const session = await auth.getSession();
    if (!session) {
      return jsonOk({ error: "Unauthorized" }, 401);
    }

    if (session.role === "trainee") {
      const enrollments = await prisma.enrollment.findMany({
        where: { traineeId: session.userId },
        include: { program: true, progress: true },
        orderBy: { updatedAt: "desc" },
      });

      const active = [];
      const completed = [];

      for (const e of enrollments) {
        const dashboard = await getEnrollmentDashboard(e.id, e.traineeId);
        const item = {
          id: e.id,
          status: e.status,
          program: e.program,
          progressPercent: dashboard?.progressPercent ?? 0,
        };
        if (e.status === "ACTIVE") {
          active.push(item);
        } else if (e.status === "COMPLETED") {
          completed.push(item);
        }
      }

      return jsonOk({ enrollments: active, completedEnrollments: completed });
    }

    return jsonOk({ enrollments: [], completedEnrollments: [] });
  } catch (error) {
    return apiError(error);
  }
}
