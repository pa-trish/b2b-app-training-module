import { hashPassword } from "@/lib/auth/credentials";
import { prisma } from "@/lib/db";
import { buildFullName } from "@/lib/users/trainee-name";

export class TraineeError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "TraineeError";
  }
}

function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

function normalizeName(value: string) {
  return value.trim();
}

/** Trainees created via the legacy enroll flow have no managerId until linked. */
async function linkOrphanedTraineesToManager(managerId: string) {
  await prisma.user.updateMany({
    where: {
      role: "TRAINEE",
      managerId: null,
      enrollments: {
        some: {
          program: { managerId },
        },
      },
    },
    data: { managerId },
  });
}

export async function listManagerTrainees(managerId: string) {
  await linkOrphanedTraineesToManager(managerId);

  return prisma.user.findMany({
    where: { role: "TRAINEE", managerId },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { name: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      enrollments: {
        select: { id: true, status: true, program: { select: { title: true } } },
      },
    },
  });
}

export async function createManagerTrainee(params: {
  managerId: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
}) {
  const firstName = normalizeName(params.firstName);
  const lastName = normalizeName(params.lastName);
  const email = normalizeEmail(params.email);

  if (!firstName) {
    throw new TraineeError("First name is required", 400);
  }
  if (!lastName) {
    throw new TraineeError("Last name is required", 400);
  }
  if (!email) {
    throw new TraineeError("Email is required", 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new TraineeError("A user with this email already exists", 409);
  }

  const password = params.password || "trainee123";
  const name = buildFullName(firstName, lastName);

  return prisma.user.create({
    data: {
      email,
      name,
      firstName,
      lastName,
      passwordHash: await hashPassword(password),
      role: "TRAINEE",
      managerId: params.managerId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      createdAt: true,
    },
  });
}

export async function updateManagerTrainee(params: {
  managerId: string;
  traineeId: string;
  firstName: string;
  lastName: string;
}) {
  const trainee = await prisma.user.findFirst({
    where: {
      id: params.traineeId,
      role: "TRAINEE",
      managerId: params.managerId,
    },
  });

  if (!trainee) {
    throw new TraineeError("Trainee not found", 404);
  }

  const firstName = normalizeName(params.firstName);
  const lastName = normalizeName(params.lastName);

  if (!firstName) {
    throw new TraineeError("First name is required", 400);
  }
  if (!lastName) {
    throw new TraineeError("Last name is required", 400);
  }

  const name = buildFullName(firstName, lastName);

  return prisma.user.update({
    where: { id: trainee.id },
    data: { firstName, lastName, name },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      createdAt: true,
    },
  });
}

export async function getManagerTrainee(managerId: string, traineeId: string) {
  await linkOrphanedTraineesToManager(managerId);

  const trainee = await prisma.user.findFirst({
    where: {
      id: traineeId,
      role: "TRAINEE",
      managerId,
    },
  });

  if (!trainee) {
    throw new TraineeError("Trainee not found", 404);
  }

  return trainee;
}
