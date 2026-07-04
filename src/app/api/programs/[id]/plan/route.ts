import { getAuthAdapter } from "@/lib/auth/stub";
import { apiError, jsonOk } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const manager = await getAuthAdapter().requireManager();
    const { id } = await params;

    const program = await prisma.trainingProgram.findFirst({
      where: { id, managerId: manager.id },
      include: {
        days: {
          orderBy: { dayNumber: "asc" },
          include: {
            modules: {
              orderBy: { order: "asc" },
              include: {
                sections: { orderBy: { order: "asc" } },
                test: true,
              },
            },
          },
        },
        documents: true,
      },
    });

    if (!program) {
      return jsonOk({ error: "Not found" }, 404);
    }

    return jsonOk({ program });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const manager = await getAuthAdapter().requireManager();
    const { id } = await params;
    const body = await request.json();

    const program = await prisma.trainingProgram.findFirst({
      where: { id, managerId: manager.id },
    });
    if (!program) {
      return jsonOk({ error: "Not found" }, 404);
    }

    const programUpdates: Record<string, unknown> = {};
    if (body.title !== undefined) programUpdates.title = body.title;
    if (body.managerNotes !== undefined) programUpdates.managerNotes = body.managerNotes;
    if (body.testPolicy !== undefined) programUpdates.testPolicy = body.testPolicy;
    if (body.totalDays !== undefined) programUpdates.totalDays = Number(body.totalDays);
    if (body.dailyMinutes !== undefined) programUpdates.dailyMinutes = Number(body.dailyMinutes);

    if (Object.keys(programUpdates).length > 0) {
      await prisma.trainingProgram.update({ where: { id }, data: programUpdates });
    }

    if (body.day) {
      await prisma.trainingDay.update({
        where: { id: body.day.id },
        data: {
          title: body.day.title,
          summary: body.day.summary,
        },
      });
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
