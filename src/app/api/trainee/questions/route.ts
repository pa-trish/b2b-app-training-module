import { getAuthAdapter } from "@/lib/auth/stub";
import { apiError, jsonOk } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/training/activity";
import { requireActiveEnrollment } from "@/lib/training/enrollment";

export async function POST(request: Request) {
  try {
    const auth = getAuthAdapter();
    const session = await auth.getSession();
    if (!session || session.role !== "trainee") {
      return jsonOk({ error: "Forbidden" }, 403);
    }

    const body = await request.json();
    const { enrollmentId, moduleId, sectionId, body: questionBody } = body;

    await requireActiveEnrollment(enrollmentId, session.userId);

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
