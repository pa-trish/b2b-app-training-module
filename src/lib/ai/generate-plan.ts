import OpenAI from "openai";
import { trainingPlanSchema, type TrainingPlan } from "./schemas/training-plan";
import type { TestPolicy } from "@/lib/types";
import { getQuestionCountForComplexity } from "@/lib/training/scoring";

function getOpenAIClient() {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export function buildPlanPrompt(params: {
  totalDays: number;
  testPolicy: TestPolicy;
  managerNotes?: string | null;
  documentTexts: string[];
}): string {
  const questionCount = getQuestionCountForComplexity(params.testPolicy.complexity);

  return `You are an expert corporate training designer. Create a structured ${params.totalDays}-day training plan from the source documents.

Rules:
- Spread content evenly across exactly ${params.totalDays} days.
- Each day has 1-3 modules. Each module has 2-6 interactive sections.
- Use ONLY these componentType values: HeroIntro, KeyPointsList, ConceptCard, StepSequence, ScenarioBlock, Callout, CheckpointQuiz, ReflectionPrompt, DocumentExcerpt.
- Each module must end with a test of exactly ${questionCount} questions matching complexity "${params.testPolicy.complexity}".
- For basic: MCQ only. For intermediate: mix MCQ and true_false. For advanced: mix MCQ and scenario_mcq.
- Questions must test module-specific knowledge from the source material.
- Return valid JSON only matching this shape:
{
  "days": [
    {
      "dayNumber": 1,
      "title": "...",
      "summary": "...",
      "modules": [
        {
          "title": "...",
          "estimatedMinutes": 30,
          "sections": [{ "componentType": "HeroIntro", "content": { ... } }],
          "test": { "questions": [{ "id": "q1", "type": "mcq", "question": "...", "options": ["A","B"], "correctAnswer": "A" }] }
        }
      ]
    }
  ]
}

Component content hints:
- HeroIntro: { title, goal, estimatedMinutes }
- KeyPointsList: { title, points: string[] }
- ConceptCard: { term, definition, example }
- StepSequence: { title, steps: string[] }
- ScenarioBlock: { situation, action, outcome }
- Callout: { variant: "tip"|"warning"|"remember", text }
- CheckpointQuiz: { question, options, correctIndex }
- ReflectionPrompt: { prompt }
- DocumentExcerpt: { quote, source }

${params.managerNotes ? `Manager notes: ${params.managerNotes}` : ""}

Source documents:
${params.documentTexts.map((text, i) => `--- Document ${i + 1} ---\n${text.slice(0, 12000)}`).join("\n\n")}`;
}

export async function generateTrainingPlan(params: {
  totalDays: number;
  testPolicy: TestPolicy;
  managerNotes?: string | null;
  documentTexts: string[];
}): Promise<TrainingPlan> {
  const client = getOpenAIClient();
  const prompt = buildPlanPrompt(params);

  if (!client) {
    return buildFallbackPlan(params);
  }

  try {
    const response = await client.chat.completions.create({
      model: process.env.AI_MODEL || "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You output only valid JSON for training plans. No markdown fences.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const parsed = JSON.parse(content);
    return trainingPlanSchema.parse(parsed);
  } catch {
    return buildFallbackPlan(params);
  }
}

function buildFallbackPlan(params: {
  totalDays: number;
  testPolicy: TestPolicy;
  documentTexts: string[];
}): TrainingPlan {
  const combined = params.documentTexts.join("\n\n").slice(0, 8000);
  const paragraphs = combined.split(/\n\s*\n/).filter((p) => p.trim().length > 40);
  const chunks =
    paragraphs.length > 0
      ? paragraphs
      : ["Welcome to your training program. Review the uploaded materials and complete each module."];

  const days = Array.from({ length: params.totalDays }, (_, dayIndex) => {
    const dayNumber = dayIndex + 1;
    const chunk = chunks[dayIndex % chunks.length] ?? chunks[0];
    const questionCount = getQuestionCountForComplexity(params.testPolicy.complexity);

    return {
      dayNumber,
      title: `Day ${dayNumber}: Training Focus`,
      summary: `Today's focus covers key material from your training documents.`,
      modules: [
        {
          title: `Module ${dayNumber}.1 — Core Concepts`,
          estimatedMinutes: 30,
          sections: [
            {
              componentType: "HeroIntro" as const,
              content: {
                title: `Day ${dayNumber} Module`,
                goal: "Understand the core concepts for today",
                estimatedMinutes: 30,
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
                points: chunk
                  .split(/[.!?]/)
                  .map((s) => s.trim())
                  .filter((s) => s.length > 20)
                  .slice(0, 4),
              },
            },
            {
              componentType: "Callout" as const,
              content: {
                variant: "tip",
                text: "Take notes as you read. You will be tested on this module.",
              },
            },
          ],
          test: {
            questions: Array.from({ length: questionCount }, (_, qIndex) => ({
              id: `d${dayNumber}-q${qIndex + 1}`,
              type: "mcq" as const,
              question: `Review question ${qIndex + 1} for Day ${dayNumber} module content?`,
              options: ["Yes, I reviewed it", "No", "Partially", "Not sure"],
              correctAnswer: "Yes, I reviewed it",
              explanation: "Complete the module material before taking the test.",
            })),
          },
        },
      ],
    };
  });

  return trainingPlanSchema.parse({ days });
}
