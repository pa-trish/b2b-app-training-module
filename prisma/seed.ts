import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_TEST_POLICY } from "../src/lib/types";

const prisma = new PrismaClient();

async function main() {
  const managerPassword = await bcrypt.hash("manager123", 10);
  const traineePassword = await bcrypt.hash("trainee123", 10);

  const manager = await prisma.user.upsert({
    where: { email: "manager@demo.com" },
    update: {},
    create: {
      email: "manager@demo.com",
      name: "Demo Manager",
      passwordHash: managerPassword,
      role: "MANAGER",
    },
  });

  const trainee = await prisma.user.upsert({
    where: { email: "trainee@demo.com" },
    update: {
      firstName: "Demo",
      lastName: "Trainee",
      name: "Demo Trainee",
      managerId: manager.id,
    },
    create: {
      email: "trainee@demo.com",
      name: "Demo Trainee",
      firstName: "Demo",
      lastName: "Trainee",
      passwordHash: traineePassword,
      role: "TRAINEE",
      managerId: manager.id,
    },
  });

  const existingProgram = await prisma.trainingProgram.findFirst({
    where: { managerId: manager.id, title: "Demo Onboarding Program" },
  });

  if (existingProgram) {
    console.log("Seed data already exists. Skipping program creation.");
    console.log("\nDemo credentials:");
    console.log("  Manager: manager@demo.com / manager123");
    console.log("  Trainee: trainee@demo.com / trainee123");
    return;
  }

  const program = await prisma.trainingProgram.create({
    data: {
      managerId: manager.id,
      title: "Demo Onboarding Program",
      totalDays: 3,
      timezone: "Europe/Warsaw",
      testPolicy: DEFAULT_TEST_POLICY,
      managerNotes: "Focus on company policies and product basics.",
      status: "PUBLISHED",
      generationStatus: "COMPLETED",
      documents: {
        create: {
          fileName: "onboarding.txt",
          mimeType: "text/plain",
          storageKey: "seed/onboarding.txt",
          extractedText: `Welcome to the team!

Our company mission is to deliver excellent B2B solutions.

Key policies:
1. Always respond to clients within 24 hours.
2. Document all customer interactions in the CRM.
3. Escalate urgent issues to your manager immediately.

Product overview:
Our flagship product helps businesses automate their training workflows.
Core features include document ingestion, progress tracking, and assessments.`,
          parseStatus: "COMPLETED",
        },
      },
      days: {
        create: [
          {
            dayNumber: 1,
            title: "Welcome & Policies",
            summary: "Learn our mission and core company policies.",
            modules: {
              create: [
                {
                  order: 1,
                  title: "Company Introduction",
                  estimatedMinutes: 20,
                  sections: {
                    create: [
                      {
                        order: 1,
                        componentType: "HeroIntro",
                        content: {
                          title: "Welcome aboard",
                          goal: "Understand our mission and values",
                          estimatedMinutes: 20,
                        },
                      },
                      {
                        order: 2,
                        componentType: "KeyPointsList",
                        content: {
                          title: "Mission highlights",
                          points: [
                            "Deliver excellent B2B solutions",
                            "Put customer success first",
                            "Collaborate across teams",
                          ],
                        },
                      },
                      {
                        order: 3,
                        componentType: "Callout",
                        content: {
                          variant: "tip",
                          text: "Introduce yourself to your team in Slack today.",
                        },
                      },
                    ],
                  },
                  test: {
                    create: {
                      complexity: "basic",
                      passPercent: 70,
                      maxAttempts: 3,
                      allowRetake: false,
                      questions: [
                        {
                          id: "d1-q1",
                          type: "mcq",
                          question: "What is our response time policy for clients?",
                          options: ["24 hours", "48 hours", "1 week", "No policy"],
                          correctAnswer: "24 hours",
                        },
                        {
                          id: "d1-q2",
                          type: "true_false",
                          question: "All customer interactions should be documented in the CRM.",
                          correctAnswer: true,
                        },
                        {
                          id: "d1-q3",
                          type: "mcq",
                          question: "Who should you escalate urgent issues to?",
                          options: ["Your manager", "HR", "Finance", "Nobody"],
                          correctAnswer: "Your manager",
                        },
                        {
                          id: "d1-q4",
                          type: "mcq",
                          question: "What does our company deliver?",
                          options: [
                            "B2B solutions",
                            "Consumer mobile games",
                            "Hardware only",
                            "Consulting only",
                          ],
                          correctAnswer: "B2B solutions",
                        },
                        {
                          id: "d1-q5",
                          type: "mcq",
                          question: "What should you do on day one with your team?",
                          options: [
                            "Introduce yourself on Slack",
                            "Skip meetings",
                            "Disable CRM access",
                            "Submit vacation request",
                          ],
                          correctAnswer: "Introduce yourself on Slack",
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
          {
            dayNumber: 2,
            title: "Product Basics",
            summary: "Learn the flagship product and core features.",
            modules: {
              create: [
                {
                  order: 1,
                  title: "Product Overview",
                  estimatedMinutes: 25,
                  sections: {
                    create: [
                      {
                        order: 1,
                        componentType: "ConceptCard",
                        content: {
                          term: "Training Automation",
                          definition:
                            "Software that turns documents into structured daily training paths.",
                          example: "Upload a PDF and get daily modules with tests.",
                        },
                      },
                      {
                        order: 2,
                        componentType: "StepSequence",
                        content: {
                          title: "How customers use our product",
                          steps: [
                            "Upload training documents",
                            "Configure days and test settings",
                            "Assign trainees",
                            "Monitor progress and attempts",
                          ],
                        },
                      },
                    ],
                  },
                  test: {
                    create: {
                      complexity: "intermediate",
                      passPercent: 70,
                      maxAttempts: 3,
                      allowRetake: false,
                      questions: Array.from({ length: 8 }, (_, i) => ({
                        id: `d2-q${i + 1}`,
                        type: i % 2 === 0 ? "mcq" : "true_false",
                        question: `Product knowledge check ${i + 1}`,
                        options: i % 2 === 0 ? ["Correct answer", "Wrong", "Also wrong", "Nope"] : undefined,
                        correctAnswer: i % 2 === 0 ? "Correct answer" : true,
                      })),
                    },
                  },
                },
              ],
            },
          },
          {
            dayNumber: 3,
            title: "Scenarios & Wrap-up",
            summary: "Apply knowledge through scenarios and finish onboarding.",
            modules: {
              create: [
                {
                  order: 1,
                  title: "Client Scenario Practice",
                  estimatedMinutes: 30,
                  sections: {
                    create: [
                      {
                        order: 1,
                        componentType: "ScenarioBlock",
                        content: {
                          situation: "A client reports an urgent outage.",
                          action: "Acknowledge within 24h and escalate to your manager.",
                          outcome: "Client feels supported and issue is resolved quickly.",
                        },
                      },
                      {
                        order: 2,
                        componentType: "ReflectionPrompt",
                        content: {
                          prompt: "What questions do you still have about your role?",
                        },
                      },
                    ],
                  },
                  test: {
                    create: {
                      complexity: "advanced",
                      passPercent: 70,
                      maxAttempts: 3,
                      allowRetake: false,
                      questions: Array.from({ length: 10 }, (_, i) => ({
                        id: `d3-q${i + 1}`,
                        type: "scenario_mcq",
                        question: `Scenario question ${i + 1}: Best action?`,
                        options: ["Escalate to manager", "Ignore", "Delay response", "Close ticket"],
                        correctAnswer: "Escalate to manager",
                      })),
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      days: { include: { modules: true } },
    },
  });

  const enrollment = await prisma.enrollment.create({
    data: {
      programId: program.id,
      traineeId: trainee.id,
      startDate: new Date(),
    },
  });

  const modules = await prisma.module.findMany({
    where: { trainingDay: { programId: program.id } },
  });

  await prisma.moduleProgress.createMany({
    data: modules.map((module) => ({
      enrollmentId: enrollment.id,
      moduleId: module.id,
    })),
  });

  console.log("Seed completed.");
  console.log("\nDemo credentials:");
  console.log("  Manager: manager@demo.com / manager123");
  console.log("  Trainee: trainee@demo.com / trainee123");
  console.log(`  Program ID: ${program.id}`);
  console.log(`  Enrollment ID: ${enrollment.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
