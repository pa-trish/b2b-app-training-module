import { z } from "zod";

export const componentTypes = [
  "HeroIntro",
  "KeyPointsList",
  "ConceptCard",
  "StepSequence",
  "ScenarioBlock",
  "Callout",
  "CheckpointQuiz",
  "ReflectionPrompt",
  "DocumentExcerpt",
] as const;

export const componentSpecSchema = z.object({
  componentType: z.enum(componentTypes),
  content: z.record(z.string(), z.unknown()),
});

export const testQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["mcq", "true_false", "scenario_mcq"]),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.boolean()]),
  explanation: z.string().optional(),
});

export const testSpecSchema = z.object({
  questions: z.array(testQuestionSchema),
});

export const moduleSpecSchema = z.object({
  title: z.string(),
  estimatedMinutes: z.number().int().positive(),
  sections: z.array(componentSpecSchema).min(3),
  test: testSpecSchema,
});

export const daySpecSchema = z.object({
  dayNumber: z.number().int().positive(),
  title: z.string(),
  summary: z.string(),
  modules: z.array(moduleSpecSchema).min(2),
});

export const trainingPlanSchema = z.object({
  days: z.array(daySpecSchema).min(1),
});

export type TrainingPlan = z.infer<typeof trainingPlanSchema>;
export type DaySpec = z.infer<typeof daySpecSchema>;
