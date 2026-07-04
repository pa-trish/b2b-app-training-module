import type { EnrollmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/training/activity";

export class EnrollmentError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "EnrollmentError";
  }
}

async function seedModuleProgress(enrollmentId: string, programId: string) {
  const modules = await prisma.module.findMany({
    where: { trainingDay: { programId } },
    select: { id: true },
  });

  const existing = await prisma.moduleProgress.findMany({
    where: { enrollmentId },
    select: { moduleId: true },
  });
  const existingIds = new Set(existing.map((p) => p.moduleId));

  const missing = modules.filter((m) => !existingIds.has(m.id));
  if (missing.length > 0) {
    await prisma.moduleProgress.createMany({
      data: missing.map((module) => ({
        enrollmentId,
        moduleId: module.id,
      })),
    });
  }
}

export async function enrollTraineeInProgram(params: {
  programId: string;
  managerId: string;
  traineeId: string;
  startDate?: Date;
}) {
  const program = await prisma.trainingProgram.findFirst({
    where: {
      id: params.programId,
      managerId: params.managerId,
      status: "PUBLISHED",
    },
  });
  if (!program) {
    throw new EnrollmentError("Program not found or not published", 404);
  }

  const trainee = await prisma.user.findFirst({
    where: {
      id: params.traineeId,
      role: "TRAINEE",
      OR: [
        { managerId: params.managerId },
        {
          managerId: null,
          enrollments: {
            some: {
              program: { managerId: params.managerId },
            },
          },
        },
      ],
    },
  });
  if (!trainee) {
    throw new EnrollmentError("Trainee not found", 404);
  }

  if (trainee.managerId === null) {
    await prisma.user.update({
      where: { id: trainee.id },
      data: { managerId: params.managerId },
    });
  }

  const startDate = params.startDate ?? new Date();

  const existing = await prisma.enrollment.findUnique({
    where: {
      programId_traineeId: {
        programId: params.programId,
        traineeId: trainee.id,
      },
    },
  });

  if (existing?.status === "ACTIVE") {
    throw new EnrollmentError("Trainee is already enrolled in this program", 409);
  }

  let enrollment;
  if (existing) {
    enrollment = await prisma.enrollment.update({
      where: { id: existing.id },
      data: { status: "ACTIVE", startDate },
    });
    await seedModuleProgress(enrollment.id, params.programId);
  } else {
    enrollment = await prisma.enrollment.create({
      data: {
        programId: params.programId,
        traineeId: trainee.id,
        startDate,
      },
    });
    await seedModuleProgress(enrollment.id, params.programId);
  }

  await logActivity({
    enrollmentId: enrollment.id,
    userId: trainee.id,
    eventType: "ENROLLMENT_STARTED",
    entityType: "enrollment",
    entityId: enrollment.id,
  });

  return {
    enrollment,
    trainee: {
      id: trainee.id,
      email: trainee.email,
      firstName: trainee.firstName,
      lastName: trainee.lastName,
      name: trainee.name,
    },
  };
}

export async function updateEnrollmentStatus(params: {
  programId: string;
  enrollmentId: string;
  managerId: string;
  status: Extract<EnrollmentStatus, "COMPLETED" | "REMOVED">;
}) {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: params.enrollmentId,
      programId: params.programId,
      program: { managerId: params.managerId },
    },
    include: { trainee: true },
  });

  if (!enrollment) {
    throw new EnrollmentError("Enrollment not found", 404);
  }

  if (enrollment.status === params.status) {
    return enrollment;
  }

  if (enrollment.status !== "ACTIVE") {
    throw new EnrollmentError(`Enrollment is already ${enrollment.status.toLowerCase()}`, 400);
  }

  const updated = await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { status: params.status },
    include: { trainee: true },
  });

  await logActivity({
    enrollmentId: enrollment.id,
    userId: params.managerId,
    eventType:
      params.status === "COMPLETED" ? "ENROLLMENT_COMPLETED" : "ENROLLMENT_REMOVED",
    entityType: "enrollment",
    entityId: enrollment.id,
  });

  return updated;
}

export async function requireActiveEnrollment(enrollmentId: string, traineeId: string) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, traineeId, status: "ACTIVE" },
  });
  if (!enrollment) {
    throw new EnrollmentError("Enrollment not found or not active", 404);
  }
  return enrollment;
}
