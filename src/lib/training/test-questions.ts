import type { TestQuestion } from "@/lib/types";

export function parseTestQuestions(raw: unknown): TestQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw as TestQuestion[];
}
