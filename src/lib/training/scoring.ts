import type { TestQuestion } from "@/lib/types";

export type ScoredAttempt = {
  score: number;
  passed: boolean;
  correctCount: number;
  totalCount: number;
};

export function scoreTestAttempt(
  questions: TestQuestion[],
  answers: Record<string, string | boolean>,
  passPercent: number
): ScoredAttempt {
  let correctCount = 0;

  for (const question of questions) {
    const answer = answers[question.id];
    if (answer === undefined) continue;

    if (question.type === "true_false") {
      if (answer === question.correctAnswer) correctCount++;
    } else if (String(answer).trim() === String(question.correctAnswer).trim()) {
      correctCount++;
    }
  }

  const totalCount = questions.length;
  const score = totalCount === 0 ? 0 : (correctCount / totalCount) * 100;
  const passed = score >= passPercent;

  return { score, passed, correctCount, totalCount };
}

export function getQuestionCountForComplexity(complexity: string): number {
  switch (complexity) {
    case "basic":
      return 5;
    case "advanced":
      return 10;
    default:
      return 8;
  }
}
