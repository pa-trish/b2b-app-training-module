import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateTrainingPlan } from "@/lib/ai/generate-plan";
import type { TestPolicy } from "@/lib/types";
import type { TestQuestion } from "@/lib/types";

export async function runPlanGeneration(programId: string) {
  const program = await prisma.trainingProgram.findUnique({
    where: { id: programId },
    include: { documents: true },
  });

  if (!program) {
    throw new Error("Program not found");
  }

  await prisma.trainingProgram.update({
    where: { id: programId },
    data: {
      generationStatus: "PROCESSING",
      generationProgress: 10,
      generationError: null,
    },
  });

  try {
    const documentTexts = program.documents
      .map((doc) => doc.extractedText)
      .filter((text): text is string => Boolean(text));

    if (documentTexts.length === 0) {
      throw new Error("No extracted document text available");
    }

    await prisma.trainingProgram.update({
      where: { id: programId },
      data: { generationProgress: 40 },
    });

    const plan = await generateTrainingPlan({
      totalDays: program.totalDays,
      testPolicy: program.testPolicy as TestPolicy,
      managerNotes: program.managerNotes,
      documentTexts,
    });

    await prisma.trainingProgram.update({
      where: { id: programId },
      data: { generationProgress: 70 },
    });

    await prisma.$transaction(async (tx) => {
      const existingDays = await tx.trainingDay.findMany({
        where: { programId },
        select: { id: true },
      });
      if (existingDays.length > 0) {
        await tx.trainingDay.deleteMany({ where: { programId } });
      }

      for (const day of plan.days) {
        const trainingDay = await tx.trainingDay.create({
          data: {
            programId,
            dayNumber: day.dayNumber,
            title: day.title,
            summary: day.summary,
          },
        });

        for (const [moduleIndex, moduleSpec] of day.modules.entries()) {
          const module = await tx.module.create({
            data: {
              trainingDayId: trainingDay.id,
              order: moduleIndex + 1,
              title: moduleSpec.title,
              estimatedMinutes: moduleSpec.estimatedMinutes,
            },
          });

          for (const [sectionIndex, section] of moduleSpec.sections.entries()) {
            await tx.moduleSection.create({
              data: {
                moduleId: module.id,
                order: sectionIndex + 1,
                componentType: section.componentType,
                content: section.content as Prisma.InputJsonValue,
              },
            });
          }

          const testPolicy = program.testPolicy as TestPolicy;
          await tx.moduleTest.create({
            data: {
              moduleId: module.id,
              questions: moduleSpec.test.questions as unknown as Prisma.InputJsonValue,
              passPercent: testPolicy.passPercent,
              maxAttempts: testPolicy.maxAttempts,
              complexity: testPolicy.complexity,
              allowRetake: testPolicy.allowRetakeAfterPass,
            },
          });
        }
      }

      await tx.trainingProgram.update({
        where: { id: programId },
        data: {
          status: "REVIEW",
          generationStatus: "COMPLETED",
          generationProgress: 100,
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    await prisma.trainingProgram.update({
      where: { id: programId },
      data: {
        generationStatus: "FAILED",
        generationError: message,
      },
    });
    throw error;
  }
}

export function parseTestQuestions(raw: unknown): TestQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw as TestQuestion[];
}
