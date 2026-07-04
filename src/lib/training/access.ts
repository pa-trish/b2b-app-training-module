import { redirect } from "next/navigation";
import type { EnrollmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

type Session = {
  role: string;
  userId: string;
};

export async function getEnrollmentForPage(
  enrollmentId: string,
  session: Session,
  options?: { preview?: boolean; requireActive?: boolean }
) {
  const { preview, requireActive = true } = options ?? {};

  if (session.role === "manager" && preview) {
    return prisma.enrollment.findFirst({
      where: { id: enrollmentId, program: { managerId: session.userId } },
    });
  }

  if (session.role === "trainee") {
    const where: {
      id: string;
      traineeId: string;
      status?: EnrollmentStatus;
    } = {
      id: enrollmentId,
      traineeId: session.userId,
    };
    if (requireActive) {
      where.status = "ACTIVE";
    }
    return prisma.enrollment.findFirst({ where });
  }

  return null;
}

export async function requireEnrollmentPageAccess(
  enrollmentId: string,
  session: Session | null,
  options?: { preview?: boolean; requireActive?: boolean; fallback?: string }
) {
  if (!session) redirect("/login");

  const enrollment = await getEnrollmentForPage(enrollmentId, session, options);
  if (!enrollment) {
    redirect(options?.fallback ?? (session.role === "trainee" ? "/trainee" : "/manager/dashboard"));
  }

  return enrollment;
}
