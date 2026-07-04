import type OpenAI from "openai";
import { ZodError } from "zod";
import { getAIClient, getAIModel } from "@/lib/ai/client";
import { trainingPlanSchema, daySpecSchema, type TrainingPlan, type DaySpec } from "./schemas/training-plan";
import { getComplexityBucket, DEFAULT_MATERIAL_COMPLEXITY, type TestPolicy } from "@/lib/types";
import { getQuestionCountForComplexity } from "@/lib/training/scoring";
import { stripDayPrefix } from "@/lib/training/day-title";

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function clampComplexityScore(score: number): number {
  return Math.min(100, Math.max(0, score));
}

/**
 * Interpolates a length multiplier from the granular 0–100 material
 * complexity score: 0.8x at the "basic" end, 1.0x at the midpoint
 * (intermediate default), up to 1.35x at the "advanced" end. This is what
 * actually lengthens/shortens the suggested training duration.
 */
function getComplexityMultiplier(score: number): number {
  const clamped = clampComplexityScore(score);
  if (clamped <= 50) {
    return 0.8 + (clamped / 50) * (1.0 - 0.8);
  }
  return 1.0 + ((clamped - 50) / 50) * (1.35 - 1.0);
}

function getSectionRange(score: number): { min: number; max: number } {
  const clamped = clampComplexityScore(score);
  const min = Math.round(3 + (clamped / 100) * 1);
  const max = Math.round(4 + (clamped / 100) * 2);
  return { min, max };
}

function getComplexityGuidance(score: number): string {
  switch (getComplexityBucket(score)) {
    case "basic":
      return "Keep explanations simple, concise, and focused on core concepts only.";
    case "advanced":
      return "Include deeper analysis, nuanced edge cases, and more detailed explanations in each section.";
    default:
      return "Balance clarity with enough detail to build solid understanding.";
  }
}

export function suggestDays(
  totalWords: number,
  dailyMinutes: number,
  materialComplexity: number = DEFAULT_MATERIAL_COMPLEXITY
): number {
  const totalMinutes = (totalWords / 150) * 1.6 * getComplexityMultiplier(materialComplexity);
  return Math.min(30, Math.max(1, Math.ceil(totalMinutes / dailyMinutes)));
}

function getModuleRange(dailyMinutes: number): { min: number; max: number } {
  if (dailyMinutes <= 60) return { min: 1, max: 2 };
  if (dailyMinutes <= 120) return { min: 2, max: 3 };
  if (dailyMinutes <= 240) return { min: 3, max: 4 };
  if (dailyMinutes <= 420) return { min: 4, max: 5 };
  return { min: 5, max: 6 };
}

function getModuleMinutes(dailyMinutes: number, moduleCount: number): { min: number; max: number } {
  const target = Math.round(dailyMinutes / moduleCount);
  return { min: Math.max(15, target - 10), max: target + 10 };
}

function sliceDocumentForDay(documentTexts: string[], dayIndex: number, totalDays: number): string {
  const combined = documentTexts.join("\n\n");
  const MAX_EXCERPT = 9000;

  // Short documents don't benefit from splitting — every day sees the full text.
  if (combined.length <= MAX_EXCERPT || totalDays <= 1) {
    return combined.slice(0, MAX_EXCERPT);
  }

  const chunkSize = Math.ceil(combined.length / totalDays);
  const start = Math.max(0, dayIndex * chunkSize - 300); // small overlap for continuity
  const end = Math.min(combined.length, start + chunkSize + 300);
  return combined.slice(start, end).slice(0, MAX_EXCERPT);
}

function buildDayPrompt(params: {
  dayNumber: number;
  totalDays: number;
  dailyMinutes: number;
  testPolicy: TestPolicy;
  managerNotes?: string | null;
  documentExcerpt: string;
}): string {
  const questionCount = getQuestionCountForComplexity(params.testPolicy.complexity);
  const { min: minModules, max: maxModules } = getModuleRange(params.dailyMinutes);
  const targetModules = Math.round((minModules + maxModules) / 2);
  const { min: minMin, max: maxMin } = getModuleMinutes(params.dailyMinutes, targetModules);
  const materialComplexity = params.testPolicy.materialComplexity ?? DEFAULT_MATERIAL_COMPLEXITY;
  const { min: minSections, max: maxSections } = getSectionRange(materialComplexity);
  const complexityGuidance = getComplexityGuidance(materialComplexity);
  const dailyLabel = formatMinutes(params.dailyMinutes);

  return `You are an expert corporate training designer. Create ONLY day ${params.dayNumber} of ${params.totalDays} for a multi-day training plan, based on the source material excerpt below.

Learning budget: ${dailyLabel} of learning for this day.
Complexity level: ${params.testPolicy.complexity}. ${complexityGuidance}

Rules:
- Generate exactly one day: dayNumber ${params.dayNumber}.
- This day must have ${minModules}–${maxModules} modules covering distinct topics from the source material excerpt.
- Each module must have estimatedMinutes between ${minMin} and ${maxMin}.
- The sum of all module estimatedMinutes for this day should be approximately ${params.dailyMinutes} minutes.
- Each module must have ${minSections}–${maxSections} sections:
    • First section: always HeroIntro (module title, learning goal, estimatedMinutes)
    • Middle sections: content sections using the component types below, derived from the source material
    • Optional final content section: ReflectionPrompt or CheckpointQuiz
- Use ONLY these componentType values: HeroIntro, KeyPointsList, ConceptCard, StepSequence, ScenarioBlock, Callout, CheckpointQuiz, ReflectionPrompt, DocumentExcerpt.
- Each module must include a test of exactly ${questionCount} questions matching complexity "${params.testPolicy.complexity}".
- For basic: MCQ only. For intermediate: mix MCQ and true_false. For advanced: mix MCQ and scenario_mcq.
- All module titles, section content, and test questions must be specific and derived from the source material — no generic placeholders.
- The day "title" must be a short descriptive name only — do NOT prefix it with "Day N:" (the UI adds that separately).
- Keep the response compact and complete — do not run out of space before finishing the JSON.
- Return valid JSON only, matching this exact shape (exactly one entry in "days"):
{
  "days": [
    {
      "dayNumber": ${params.dayNumber},
      "title": "...",
      "summary": "...",
      "modules": [
        {
          "title": "...",
          "estimatedMinutes": ${Math.round((minMin + maxMin) / 2)},
          "sections": [
            { "componentType": "HeroIntro", "content": { "title": "...", "goal": "...", "estimatedMinutes": ${Math.round((minMin + maxMin) / 2)} } },
            { "componentType": "KeyPointsList", "content": { "title": "...", "points": ["...", "..."] } }
          ],
          "test": {
            "questions": [
              { "id": "d${params.dayNumber}-m1-q1", "type": "mcq", "question": "...", "options": ["A","B","C","D"], "correctAnswer": "A", "explanation": "..." }
            ]
          }
        }
      ]
    }
  ]
}

Component content shapes:
- HeroIntro: { title, goal, estimatedMinutes }
- KeyPointsList: { title, points: string[] }
- ConceptCard: { term, definition, example }
- StepSequence: { title, steps: string[] }
- ScenarioBlock: { situation, action, outcome }
- Callout: { variant: "tip"|"warning"|"remember", text }
- CheckpointQuiz: { question, options: string[], correctIndex: number }
- ReflectionPrompt: { prompt }
- DocumentExcerpt: { quote, source }

${params.managerNotes ? `Manager notes: ${params.managerNotes}` : ""}

Source material excerpt for day ${params.dayNumber} of ${params.totalDays}:
${params.documentExcerpt}`;
}

export function extractJsonFromModelContent(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function normalizeTrainingPlan(raw: unknown, minModules: number): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const plan = raw as { days?: unknown[] };
  if (!Array.isArray(plan.days)) return raw;

  return {
    days: plan.days.map((day, dayIndex) => {
      const d = day as Record<string, unknown>;
      const modules = Array.isArray(d.modules) ? [...d.modules] : [];

      // Ensure minimum modules per day by duplicating/padding if needed
      while (modules.length < minModules && modules.length > 0) {
        const last = modules[modules.length - 1] as Record<string, unknown>;
        modules.push({
          ...last,
          title: `${String(last.title ?? "Module")} — Continued`,
        });
      }

      return {
        ...d,
        dayNumber: typeof d.dayNumber === "number" ? d.dayNumber : dayIndex + 1,
        title: typeof d.title === "string" ? stripDayPrefix(d.title) : d.title,
        modules: modules.map((mod, modIndex) => {
          const m = mod as Record<string, unknown>;
          const sections = Array.isArray(m.sections) ? [...m.sections] : [];
          const test = (m.test as Record<string, unknown> | undefined) ?? { questions: [] };
          const questions = Array.isArray(test.questions) ? test.questions : [];

          // Ensure HeroIntro is first
          const hasHero = sections.some(
            (s) => (s as Record<string, unknown>).componentType === "HeroIntro"
          );
          if (!hasHero) {
            sections.unshift({
              componentType: "HeroIntro",
              content: {
                title: String(m.title ?? "Module"),
                goal: "Complete this module to continue your training",
                estimatedMinutes: Number(m.estimatedMinutes) || 30,
              },
            });
          }

          while (sections.length < 3) {
            sections.push({
              componentType: "Callout",
              content: { variant: "tip", text: "Review the material carefully before the test." },
            });
          }

          return {
            ...m,
            estimatedMinutes: Math.max(1, Math.round(Number(m.estimatedMinutes) || 30)),
            sections,
            test: {
              ...test,
              questions: questions.map((q, qIndex) => {
                const question = q as Record<string, unknown>;
                let correctAnswer = question.correctAnswer;
                if (question.type === "true_false") {
                  if (correctAnswer === "true" || correctAnswer === "True") correctAnswer = true;
                  else if (correctAnswer === "false" || correctAnswer === "False") correctAnswer = false;
                }
                const normalized: Record<string, unknown> = {
                  ...question,
                  id: String(question.id || `d${dayIndex + 1}-m${modIndex + 1}-q${qIndex + 1}`),
                  correctAnswer,
                };
                if (
                  (question.type === "mcq" || question.type === "scenario_mcq") &&
                  (!Array.isArray(normalized.options) || (normalized.options as string[]).length < 2)
                ) {
                  normalized.options = ["Option A", "Option B", "Option C", "Option D"];
                }
                return normalized;
              }),
            },
          };
        }),
      };
    }),
  };
}

function formatJsonSyntaxError(error: SyntaxError, jsonLength: number): string {
  const positionMatch = error.message.match(/position (\d+)/i);
  const position = positionMatch ? Number(positionMatch[1]) : null;
  const nearEnd = position !== null && position >= jsonLength - 200;

  if (nearEnd) {
    return (
      "The AI response was cut off before the plan JSON finished (likely too much content for one request). " +
      "Try fewer training days, less daily time, or switch to a stronger model such as Google or OpenAI."
    );
  }

  return (
    "The AI returned malformed JSON and the plan could not be parsed. " +
    "Retry generation or switch from the free model to Google, OpenAI, or Anthropic."
  );
}

function parseModelJsonContent(raw: string): unknown {
  const jsonText = extractJsonFromModelContent(raw);
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(formatJsonSyntaxError(error, jsonText.length));
    }
    throw error;
  }
}

function formatGenerationError(error: unknown): string {
  if (error instanceof ZodError) {
    const details = error.issues
      .slice(0, 3)
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    return `AI returned an invalid plan structure: ${details}`;
  }
  if (error instanceof Error) return error.message;
  return "AI plan generation failed";
}

async function requestPlanFromModel(
  client: OpenAI,
  model: string,
  prompt: string,
  useJsonMode: boolean
) {
  const request = {
    model,
    messages: [
      {
        role: "system" as const,
        content: "You output only valid JSON for training plans. No markdown fences, no commentary.",
      },
      { role: "user" as const, content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 12000,
  };
  if (useJsonMode) {
    return client.chat.completions.create({ ...request, response_format: { type: "json_object" } });
  }
  return client.chat.completions.create(request);
}

export async function generateTrainingPlan(params: {
  totalDays: number;
  dailyMinutes: number;
  testPolicy: TestPolicy;
  managerNotes?: string | null;
  documentTexts: string[];
  aiProvider?: string;
  onDayComplete?: (dayNumber: number, totalDays: number) => void | Promise<void>;
}): Promise<TrainingPlan> {
  const client = getAIClient();
  const model = getAIModel(params.aiProvider);
  const { min: minModules } = getModuleRange(params.dailyMinutes);

  if (!client) {
    console.warn("[generate-plan] AI_API_KEY not set — using offline fallback plan");
    return buildFallbackPlan(params);
  }

  const days: DaySpec[] = [];

  for (let dayNumber = 1; dayNumber <= params.totalDays; dayNumber++) {
    const documentExcerpt = sliceDocumentForDay(params.documentTexts, dayNumber - 1, params.totalDays);
    const prompt = buildDayPrompt({
      dayNumber,
      totalDays: params.totalDays,
      dailyMinutes: params.dailyMinutes,
      testPolicy: params.testPolicy,
      managerNotes: params.managerNotes,
      documentExcerpt,
    });

    let lastError: unknown;
    let daySpec: DaySpec | null = null;

    for (const useJsonMode of [true, false]) {
      try {
        const response = await requestPlanFromModel(client, model, prompt, useJsonMode);
        const choice = response.choices[0];
        const content = choice?.message?.content;
        if (!content?.trim()) throw new Error("Empty AI response");
        if (choice?.finish_reason === "length") {
          throw new Error(
            `Day ${dayNumber}'s response was cut off before finishing (too much content for one request). ` +
              "Try less daily learning time, or switch to a stronger model such as Google or OpenAI."
          );
        }

        const parsed = parseModelJsonContent(content) as { days?: unknown[] };
        const normalized = normalizeTrainingPlan(parsed, minModules) as { days?: unknown[] };
        const rawDay = normalized.days?.[0] as Record<string, unknown> | undefined;
        if (!rawDay) throw new Error(`AI did not return content for day ${dayNumber}`);
        rawDay.dayNumber = dayNumber;
        daySpec = daySpecSchema.parse(rawDay);
        break;
      } catch (error) {
        lastError = error;
        console.error(
          `[generate-plan] Day ${dayNumber}/${params.totalDays} attempt failed (jsonMode=${useJsonMode}, model=${model}):`,
          error
        );
      }
    }

    if (!daySpec) {
      throw new Error(`Day ${dayNumber} of ${params.totalDays} — ${formatGenerationError(lastError)}`);
    }

    days.push(daySpec);
    if (params.onDayComplete) {
      await params.onDayComplete(dayNumber, params.totalDays);
    }
  }

  return trainingPlanSchema.parse({ days });
}

function buildFallbackPlan(params: {
  totalDays: number;
  dailyMinutes: number;
  testPolicy: TestPolicy;
  documentTexts: string[];
}): TrainingPlan {
  const combined = params.documentTexts.join("\n\n").slice(0, 16000);
  const paragraphs = combined.split(/\n\s*\n/).filter((p) => p.trim().length > 40);
  const sentences = combined
    .split(/[.!?]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const { min: minModules, max: maxModules } = getModuleRange(params.dailyMinutes);
  const modulesPerDay = Math.round((minModules + maxModules) / 2);
  const minutesPerModule = Math.round(params.dailyMinutes / modulesPerDay);
  const questionCount = getQuestionCountForComplexity(params.testPolicy.complexity);

  const totalChunks = params.totalDays * modulesPerDay;
  const chunks: string[] = [];
  for (let i = 0; i < totalChunks; i++) {
    chunks.push(paragraphs[i % Math.max(paragraphs.length, 1)] ?? sentences[i % Math.max(sentences.length, 1)] ?? combined.slice(0, 200));
  }

  const days = Array.from({ length: params.totalDays }, (_, dayIndex) => {
    const dayNumber = dayIndex + 1;
    const dayLabel = `Day ${dayNumber}`;

    const modules = Array.from({ length: modulesPerDay }, (_, modIndex) => {
      const chunkIndex = dayIndex * modulesPerDay + modIndex;
      const chunk = chunks[chunkIndex] ?? chunks[0];
      const chunkSentences = chunk.split(/[.!?]/).map((s) => s.trim()).filter((s) => s.length > 15);
      const moduleTitle = chunkSentences[0]?.slice(0, 70) || `Module ${modIndex + 1}`;

      return {
        title: moduleTitle,
        estimatedMinutes: minutesPerModule,
        sections: [
          {
            componentType: "HeroIntro" as const,
            content: {
              title: moduleTitle,
              goal: chunkSentences[1]?.slice(0, 120) || "Understand the key concepts from this section",
              estimatedMinutes: minutesPerModule,
            },
          },
          {
            componentType: "DocumentExcerpt" as const,
            content: {
              quote: chunk.slice(0, 500),
              source: "Uploaded training material",
            },
          },
          {
            componentType: "KeyPointsList" as const,
            content: {
              title: "Key takeaways",
              points: chunkSentences.slice(0, 4).length >= 2
                ? chunkSentences.slice(0, 4)
                : ["Review the material carefully", "Apply the concepts in practice"],
            },
          },
          {
            componentType: "Callout" as const,
            content: {
              variant: "tip" as const,
              text: "Take notes as you read. You will be tested on this module.",
            },
          },
        ],
        test: {
          questions: Array.from({ length: questionCount }, (_, qIndex) => {
            const s = chunkSentences[qIndex] ?? chunkSentences[0] ?? "Review the material";
            return {
              id: `d${dayNumber}-m${modIndex + 1}-q${qIndex + 1}`,
              type: "mcq" as const,
              question: `Which of the following best reflects the training content?`,
              options: [
                s.slice(0, 120),
                "None of the above",
                "This topic is not covered",
                "I did not read the material",
              ],
              correctAnswer: s.slice(0, 120),
              explanation: "Review the module content from your uploaded document.",
            };
          }),
        },
      };
    });

    const firstChunk = chunks[dayIndex * modulesPerDay] ?? "";
    const firstSentences = firstChunk.split(/[.!?]/).map((s) => s.trim()).filter((s) => s.length > 15);

    return {
      dayNumber,
      title: firstSentences[0]?.slice(0, 60) || "Training Focus",
      summary: firstSentences[1]?.slice(0, 160) || `${dayLabel} covers key material from your uploaded documents.`,
      modules,
    };
  });

  return trainingPlanSchema.parse({ days });
}
