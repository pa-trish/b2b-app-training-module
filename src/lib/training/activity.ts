import type { ActivityEventType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function logActivity(params: {
  enrollmentId: string;
  userId: string;
  eventType: ActivityEventType;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.activityLog.create({
    data: {
      enrollmentId: params.enrollmentId,
      userId: params.userId,
      eventType: params.eventType,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
    },
  });
}
