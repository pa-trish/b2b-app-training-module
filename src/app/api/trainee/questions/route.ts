import { getAuthAdapter } from "@/lib/auth/stub";
import { apiError, jsonOk } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/training/activity";

export async function POST(request: Request) {
  try {
    const auth = getAuthAdapter();
    const session = await auth.getSession();
    if (!session || session.role !== "trainee") {
      return jsonOk({ error: "Forbidden" }, 403);
    }

    const body = await request.json();
    const { enrollmentId, moduleId, sectionId, body: questionBody } = body;

    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, traineeId: session.userId },
    });
    if (!enrollment) {
      return jsonOk({ error: "Enrollment not found" }, 404);
    }

    const question = await prisma.traineeQuestion.create({
      data: {
        enrollmentId,
        moduleId,
        sectionId: sectionId || null,
        body: questionBody,
      },
    });

    await logActivity({
      enrollmentId,
      userId: session.userId,
      eventType: "QUESTION_SUBMITTED",
      entityType: "question",
      entityId: question.id,
    });

    return jsonOk({ question }, 201);
  } catch (error) {
    return apiError(error);
  }
}
