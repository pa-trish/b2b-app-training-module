import { getAuthAdapter } from "@/lib/auth/stub";
import { hashPassword } from "@/lib/auth/credentials";
import { apiError, jsonOk } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/training/activity";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const manager = await getAuthAdapter().requireManager();
    const { id } = await params;
    const body = await request.json();

    const program = await prisma.trainingProgram.findFirst({
      where: { id, managerId: manager.id, status: "PUBLISHED" },
    });
    if (!program) {
      return jsonOk({ error: "Program not found or not published" }, 404);
    }

    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "trainee123");
    const name = String(body.name || email.split("@")[0]);
    const startDate = body.startDate ? new Date(body.startDate) : new Date();

    let trainee = await prisma.user.findUnique({ where: { email } });
    if (!trainee) {
      trainee = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: await hashPassword(password),
          role: "TRAINEE",
        },
      });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        programId: id,
        traineeId: trainee.id,
        startDate,
      },
    });

    const modules = await prisma.module.findMany({
      where: { trainingDay: { programId: id } },
    });

    await prisma.moduleProgress.createMany({
      data: modules.map((module) => ({
        enrollmentId: enrollment.id,
        moduleId: module.id,
      })),
    });

    await logActivity({
      enrollmentId: enrollment.id,
      userId: trainee.id,
      eventType: "ENROLLMENT_STARTED",
      entityType: "enrollment",
      entityId: enrollment.id,
    });

    return jsonOk({ enrollment, trainee: { email, name } }, 201);
  } catch (error) {
    return apiError(error);
  }
}
