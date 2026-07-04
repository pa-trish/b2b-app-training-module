import { getAuthAdapter } from "@/lib/auth/stub";
import { apiError, jsonOk } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/training/activity";
import { parseTestQuestions } from "@/lib/training/test-questions";
import { scoreTestAttempt } from "@/lib/training/scoring";
import { requireActiveEnrollment } from "@/lib/training/enrollment";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthAdapter();
    const session = await auth.getSession();
    if (!session || session.role !== "trainee") {
      return jsonOk({ error: "Forbidden" }, 403);
    }

    const { id: moduleId } = await params;
    const body = await request.json();
    const { enrollmentId, action, answers, attemptId } = body;

    const enrollment = await requireActiveEnrollment(enrollmentId, session.userId);

    const module = await prisma.module.findFirst({
      where: { id: moduleId, trainingDay: { programId: enrollment.programId } },
      include: { test: true, sections: true },
    });
    if (!module?.test) {
      return jsonOk({ error: "Test not found" }, 404);
    }

    const progress = await prisma.moduleProgress.findUnique({
      where: { enrollmentId_moduleId: { enrollmentId, moduleId } },
    });

    const sectionsDone = module.sections.every((s) =>
      (progress?.sectionsCompleted ?? []).includes(s.order)
    );
    if (!sectionsDone) {
      return jsonOk({ error: "Complete all sections before taking the test" }, 400);
    }

    const existingAttempts = await prisma.testAttempt.count({
      where: { enrollmentId, moduleTestId: module.test.id },
    });

    if (action === "start") {
      if (existingAttempts >= module.test.maxAttempts) {
        return jsonOk({ error: "Maximum attempts reached" }, 400);
      }

      const passed = await prisma.testAttempt.findFirst({
        where: { enrollmentId, moduleTestId: module.test.id, passed: true },
      });
      if (passed && !module.test.allowRetake) {
        return jsonOk({ error: "Test already passed" }, 400);
      }

      const attempt = await prisma.testAttempt.create({
        data: {
          enrollmentId,
          moduleTestId: module.test.id,
          attemptNumber: existingAttempts + 1,
        },
      });

      await logActivity({
        enrollmentId,
        userId: session.userId,
        eventType: "TEST_STARTED",
        entityType: "test_attempt",
        entityId: attempt.id,
        metadata: { attemptNumber: attempt.attemptNumber },
      });

      return jsonOk({ attemptId: attempt.id, attemptNumber: attempt.attemptNumber });
    }

    if (action === "submit") {
      const attempt = await prisma.testAttempt.findFirst({
        where: {
          id: attemptId,
          enrollmentId,
          moduleTestId: module.test.id,
          finishedAt: null,
        },
      });
      if (!attempt) {
        return jsonOk({ error: "Active attempt not found" }, 404);
      }

      const questions = parseTestQuestions(module.test.questions);
      const result = scoreTestAttempt(questions, answers ?? {}, module.test.passPercent);

      const updatedAttempt = await prisma.testAttempt.update({
        where: { id: attempt.id },
        data: {
          answers,
          score: result.score,
          passed: result.passed,
          finishedAt: new Date(),
        },
      });

      await logActivity({
        enrollmentId,
        userId: session.userId,
        eventType: "TEST_SUBMITTED",
        entityType: "test_attempt",
        entityId: attempt.id,
        metadata: {
          score: result.score,
          passed: result.passed,
          attemptNumber: attempt.attemptNumber,
        },
      });

      if (result.passed) {
        await prisma.moduleProgress.update({
          where: { enrollmentId_moduleId: { enrollmentId, moduleId } },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });

        await logActivity({
          enrollmentId,
          userId: session.userId,
          eventType: "MODULE_COMPLETED",
          entityType: "module",
          entityId: moduleId,
        });
      }

      return jsonOk({
        attempt: updatedAttempt,
        score: result.score,
        passed: result.passed,
      });
    }

    return jsonOk({ error: "Invalid action" }, 400);
  } catch (error) {
    return apiError(error);
  }
}
