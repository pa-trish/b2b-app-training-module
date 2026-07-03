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
        where: { traineeId: session.userId, status: "ACTIVE" },
        include: { program: true, progress: true },
      });

      const result = await Promise.all(
        enrollments.map(async (e) => {
          const dashboard = await getEnrollmentDashboard(e.id, e.traineeId);
          return {
            id: e.id,
            program: e.program,
            progressPercent: dashboard?.progressPercent ?? 0,
          };
        })
      );

      return jsonOk({ enrollments: result });
    }

    return jsonOk({ enrollments: [] });
  } catch (error) {
    return apiError(error);
  }
}
