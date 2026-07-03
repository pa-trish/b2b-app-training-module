import type { ModuleProgressStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ModuleStatus } from "@/lib/types";
import {
  getCurrentTrainingDay,
  getDayUnlockDate,
  getDayUnlockState,
  formatUnlockDate,
} from "@/lib/training/unlock";
import { parseTestQuestions } from "@/lib/ai/persist-plan";

export function toModuleStatus(status: ModuleProgressStatus): ModuleStatus {
  switch (status) {
    case "IN_PROGRESS":
      return "in_progress";
    case "COMPLETED":
      return "completed";
    default:
      return "not_started";
  }
}

export async function getEnrollmentDashboard(enrollmentId: string, traineeId: string) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, traineeId },
    include: {
      program: {
        include: {
          days: {
            orderBy: { dayNumber: "asc" },
            include: {
              modules: {
                orderBy: { order: "asc" },
                include: { test: true },
              },
            },
          },
        },
      },
      progress: true,
      attempts: true,
    },
  });

  if (!enrollment) return null;

  const progressMap = new Map(enrollment.progress.map((p) => [p.moduleId, p]));
  const passedTests = new Set(
    enrollment.attempts.filter((a) => a.passed).map((a) => a.moduleTestId)
  );

  const days = enrollment.program.days.map((day) => {
    const modules = day.modules.map((module) => {
      const progress = progressMap.get(module.id);
      const hasPassedTest = module.test ? passedTests.has(module.test.id) : true;

      let status: ModuleStatus = "not_started";
      if (progress?.status === "COMPLETED" && hasPassedTest) {
        status = "completed";
      } else if (progress?.status === "IN_PROGRESS" || (progress?.startedAt && !hasPassedTest)) {
        status = "in_progress";
      }

      return {
        id: module.id,
        title: module.title,
        estimatedMinutes: module.estimatedMinutes,
        status: status as ModuleStatus,
        order: module.order,
      };
    });

    const allComplete = modules.every((m) => m.status === "completed");
    const state = getDayUnlockState(
      enrollment.startDate,
      day.dayNumber,
      enrollment.program.timezone,
      allComplete
    );

    return {
      id: day.id,
      dayNumber: day.dayNumber,
      title: day.title,
      summary: day.summary,
      state,
      unlockDate: formatUnlockDate(
        getDayUnlockDate(enrollment.startDate, day.dayNumber),
        enrollment.program.timezone
      ),
      modules,
      allComplete,
    };
  });

  const currentDay = getCurrentTrainingDay(
    enrollment.startDate,
    enrollment.program.totalDays,
    enrollment.program.timezone
  );

  const completedModules = days.flatMap((d) => d.modules).filter((m) => m.status === "completed").length;
  const totalModules = days.flatMap((d) => d.modules).length;

  return {
    enrollment: {
      id: enrollment.id,
      startDate: enrollment.startDate,
      status: enrollment.status,
    },
    program: {
      id: enrollment.program.id,
      title: enrollment.program.title,
      totalDays: enrollment.program.totalDays,
      timezone: enrollment.program.timezone,
    },
    currentDay,
    days,
    progressPercent: totalModules === 0 ? 0 : Math.round((completedModules / totalModules) * 100),
  };
}

export async function getModuleDetail(moduleId: string, enrollmentId: string, traineeId: string) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, traineeId },
    include: {
      program: true,
      progress: { where: { moduleId } },
      attempts: {
        where: { moduleTest: { moduleId } },
        orderBy: { attemptNumber: "asc" },
      },
    },
  });

  if (!enrollment) return null;

  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      sections: { orderBy: { order: "asc" } },
      test: true,
      trainingDay: true,
    },
  });

  if (!module || module.trainingDay.programId !== enrollment.programId) return null;

  const progress = enrollment.progress[0];
  const test = module.test;

  return {
    module: {
      id: module.id,
      title: module.title,
      estimatedMinutes: module.estimatedMinutes,
      dayNumber: module.trainingDay.dayNumber,
      sections: module.sections.map((s) => ({
        id: s.id,
        order: s.order,
        componentType: s.componentType,
        content: s.content,
      })),
    },
    progress: {
      status: toModuleStatus(progress?.status ?? "NOT_STARTED"),
      sectionsCompleted: progress?.sectionsCompleted ?? [],
      startedAt: progress?.startedAt,
      completedAt: progress?.completedAt,
    },
    test: test
      ? {
          id: test.id,
          questions: parseTestQuestions(test.questions),
          passPercent: test.passPercent,
          maxAttempts: test.maxAttempts,
          allowRetake: test.allowRetake,
          complexity: test.complexity,
          attemptsUsed: enrollment.attempts.length,
          lastPassed: enrollment.attempts.some((a) => a.passed),
          attempts: enrollment.attempts.map((a) => ({
            id: a.id,
            attemptNumber: a.attemptNumber,
            score: a.score,
            passed: a.passed,
            startedAt: a.startedAt,
            finishedAt: a.finishedAt,
          })),
        }
      : null,
    enrollmentId: enrollment.id,
    programTimezone: enrollment.program.timezone,
    startDate: enrollment.startDate,
  };
}

export async function getManagerDashboard(managerId: string) {
  const programs = await prisma.trainingProgram.findMany({
    where: { managerId },
    orderBy: { updatedAt: "desc" },
    include: {
      enrollments: {
        include: {
          trainee: true,
          progress: true,
          attempts: true,
          program: {
            include: {
              days: { include: { modules: true } },
            },
          },
        },
      },
      days: { include: { modules: true } },
      _count: { select: { documents: true, enrollments: true } },
    },
  });

  return programs.map((program) => {
    const totalModules = program.days.reduce((acc, d) => acc + d.modules.length, 0);

    const trainees = program.enrollments.map((enrollment) => {
      const completed = enrollment.progress.filter((p) => p.status === "COMPLETED").length;
      const currentDay = getCurrentTrainingDay(
        enrollment.startDate,
        program.totalDays,
        program.timezone
      );

      return {
        enrollmentId: enrollment.id,
        name: enrollment.trainee.name,
        email: enrollment.trainee.email,
        startDate: enrollment.startDate,
        status: enrollment.status,
        currentDay,
        progressPercent: totalModules === 0 ? 0 : Math.round((completed / totalModules) * 100),
        testAttempts: enrollment.attempts.length,
        openQuestions: 0,
      };
    });

    return {
      id: program.id,
      title: program.title,
      status: program.status,
      totalDays: program.totalDays,
      documentCount: program._count.documents,
      traineeCount: program._count.enrollments,
      trainees,
    };
  });
}

export async function getEnrollmentLogs(enrollmentId: string, managerId: string) {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      program: { managerId },
    },
    include: {
      trainee: true,
      program: true,
      logs: { orderBy: { occurredAt: "desc" } },
      attempts: {
        include: { moduleTest: { include: { module: true } } },
        orderBy: { startedAt: "desc" },
      },
      progress: {
        include: { module: { include: { trainingDay: true } } },
      },
      questions: {
        include: { module: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return enrollment;
}
