import { getAuthAdapter } from "@/lib/auth/stub";
import { apiError, jsonOk } from "@/lib/api/helpers";
import { DEFAULT_TEST_POLICY } from "@/lib/types";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const manager = await getAuthAdapter().requireManager();
    const body = await request.json();

    const program = await prisma.trainingProgram.create({
      data: {
        managerId: manager.id,
        title: body.title || "Untitled Training Program",
        totalDays: Number(body.totalDays) || 5,
        timezone: body.timezone || process.env.DEFAULT_TIMEZONE || "Europe/Warsaw",
        managerNotes: body.managerNotes || null,
        testPolicy: body.testPolicy || DEFAULT_TEST_POLICY,
        status: "DRAFT",
      },
    });

    return jsonOk({ program }, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function GET() {
  try {
    const manager = await getAuthAdapter().requireManager();
    const programs = await prisma.trainingProgram.findMany({
      where: { managerId: manager.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { documents: true, enrollments: true, days: true } },
      },
    });
    return jsonOk({ programs });
  } catch (error) {
    return apiError(error);
  }
}
