import type { ModuleProgressStatus } from "@prisma/client";
import { getAuthAdapter } from "@/lib/auth/stub";
import { apiError, jsonOk } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/training/activity";

export async function PATCH(
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
    const { enrollmentId, sectionOrder, status } = body;

    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, traineeId: session.userId },
    });
    if (!enrollment) {
      return jsonOk({ error: "Enrollment not found" }, 404);
    }

    const module = await prisma.module.findFirst({
      where: { id: moduleId, trainingDay: { programId: enrollment.programId } },
      include: { sections: true, test: true },
    });
    if (!module) {
      return jsonOk({ error: "Module not found" }, 404);
    }

    let progress = await prisma.moduleProgress.findUnique({
      where: { enrollmentId_moduleId: { enrollmentId, moduleId } },
    });

    if (!progress) {
      progress = await prisma.moduleProgress.create({
        data: { enrollmentId, moduleId },
      });
    }

    const sectionsCompleted = new Set(progress.sectionsCompleted);
    if (typeof sectionOrder === "number") {
      sectionsCompleted.add(sectionOrder);
    }

    const allSectionsDone = module.sections.every((s) => sectionsCompleted.has(s.order));
    let nextStatus: ModuleProgressStatus = progress.status;

    if (status === "in_progress" || progress.status === "NOT_STARTED") {
      nextStatus = "IN_PROGRESS";
    }

    const updateData: {
      sectionsCompleted: number[];
      status: ModuleProgressStatus;
      startedAt?: Date;
      completedAt?: Date | null;
    } = {
      sectionsCompleted: Array.from(sectionsCompleted).sort((a, b) => a - b),
      status: nextStatus,
    };

    if (!progress.startedAt) {
      updateData.startedAt = new Date();
      await logActivity({
        enrollmentId,
        userId: session.userId,
        eventType: "MODULE_STARTED",
        entityType: "module",
        entityId: moduleId,
      });
    }

    if (typeof sectionOrder === "number") {
      await logActivity({
        enrollmentId,
        userId: session.userId,
        eventType: "SECTION_COMPLETED",
        entityType: "section",
        entityId: `${moduleId}-${sectionOrder}`,
        metadata: { sectionOrder },
      });
    }

    if (status === "completed" && allSectionsDone) {
      const passedAttempt = module.test
        ? await prisma.testAttempt.findFirst({
            where: {
              enrollmentId,
              moduleTestId: module.test.id,
              passed: true,
            },
          })
        : { id: "no-test" };

      if (passedAttempt) {
        updateData.status = "COMPLETED";
        updateData.completedAt = new Date();
        await logActivity({
          enrollmentId,
          userId: session.userId,
          eventType: "MODULE_COMPLETED",
          entityType: "module",
          entityId: moduleId,
        });
      }
    }

    const updated = await prisma.moduleProgress.update({
      where: { id: progress.id },
      data: updateData,
    });

    return jsonOk({ progress: updated });
  } catch (error) {
    return apiError(error);
  }
}
