import type { User, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AuthError, getAuthAdapter } from "@/lib/auth/stub";
import { ADMIN_EMAIL } from "@/lib/admin/constants";

export { ADMIN_EMAIL };

export class AdminError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "AdminError";
  }
}

export async function requireAdmin(): Promise<User> {
  const user = await getAuthAdapter().requireUser();
  if (user.role !== "ADMIN" || user.email !== ADMIN_EMAIL) {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export async function listAllUsers() {
  return prisma.user.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      managerId: true,
      createdAt: true,
      _count: {
        select: {
          enrollments: true,
          managedPrograms: true,
          trainees: true,
        },
      },
    },
  });
}

export async function updateAdminUser(params: {
  adminId: string;
  userId: string;
  role?: UserRole;
  isActive?: boolean;
}) {
  const target = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!target) {
    throw new AdminError("User not found", 404);
  }

  if (target.email === ADMIN_EMAIL) {
    if (params.role && params.role !== "ADMIN") {
      throw new AdminError("Cannot change the admin account role", 400);
    }
    if (params.isActive === false) {
      throw new AdminError("Cannot deactivate the admin account", 400);
    }
  }

  if (params.role === "ADMIN" && target.email !== ADMIN_EMAIL) {
    throw new AdminError("Only the designated admin account can have the ADMIN role", 400);
  }

  const data: { role?: UserRole; isActive?: boolean; managerId?: string | null } = {};

  if (params.isActive !== undefined) {
    data.isActive = params.isActive;
  }

  if (params.role !== undefined) {
    data.role = params.role;
    if (params.role === "MANAGER") {
      data.managerId = null;
    }
    if (params.role === "TRAINEE" && target.role === "MANAGER") {
      data.managerId = null;
    }
  }

  return prisma.user.update({
    where: { id: params.userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      managerId: true,
      createdAt: true,
    },
  });
}

export async function listAllActivityLogs(limit = 200) {
  const logs = await prisma.activityLog.findMany({
    orderBy: { occurredAt: "desc" },
    take: limit,
    include: {
      enrollment: {
        include: {
          trainee: {
            select: { id: true, email: true, name: true },
          },
          program: {
            select: { id: true, title: true },
          },
        },
      },
    },
  });

  const userIds = [...new Set(logs.map((log) => log.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true },
  });
  const userMap = new Map(users.map((user) => [user.id, user]));

  return logs.map((log) => ({
    id: log.id,
    eventType: log.eventType,
    entityType: log.entityType,
    entityId: log.entityId,
    metadata: log.metadata,
    occurredAt: log.occurredAt,
    actor: userMap.get(log.userId) ?? { id: log.userId, email: "unknown", name: "Unknown user" },
    trainee: log.enrollment.trainee,
    program: log.enrollment.program,
    enrollmentId: log.enrollmentId,
  }));
}
