export type TestPolicy = {
  complexity: "basic" | "intermediate" | "advanced";
  /** Granular 0–100 slider value backing `complexity` (see getComplexityBucket). */
  materialComplexity: number;
  passPercent: number;
  maxAttempts: number;
  allowRetakeAfterPass: boolean;
};

export type ComponentType =
  | "HeroIntro"
  | "KeyPointsList"
  | "ConceptCard"
  | "StepSequence"
  | "ScenarioBlock"
  | "Callout"
  | "CheckpointQuiz"
  | "ReflectionPrompt"
  | "DocumentExcerpt";

export type ComponentSpec = {
  componentType: ComponentType;
  content: Record<string, unknown>;
};

export type TestQuestion = {
  id: string;
  type: "mcq" | "true_false" | "scenario_mcq";
  question: string;
  options?: string[];
  correctAnswer: string | boolean;
  explanation?: string;
};

export type ModuleStatus = "not_started" | "in_progress" | "completed";

export type DayUnlockState = "locked" | "unlocked" | "completed";

export const MATERIAL_COMPLEXITY_MIN = 0;
export const MATERIAL_COMPLEXITY_MAX = 100;
export const MATERIAL_COMPLEXITY_STEP = 5;
export const DEFAULT_MATERIAL_COMPLEXITY = 50;

export const DEFAULT_TEST_POLICY: TestPolicy = {
  complexity: "intermediate",
  materialComplexity: DEFAULT_MATERIAL_COMPLEXITY,
  passPercent: 70,
  maxAttempts: 3,
  allowRetakeAfterPass: false,
};

export const COMPLEXITY_QUESTION_COUNTS: Record<TestPolicy["complexity"], number> = {
  basic: 5,
  intermediate: 8,
  advanced: 10,
};

export const COMPLEXITY_LEVELS: TestPolicy["complexity"][] = [
  "basic",
  "intermediate",
  "advanced",
];

export const COMPLEXITY_LABELS: Record<TestPolicy["complexity"], string> = {
  basic: "Basic",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const COMPLEXITY_DESCRIPTIONS: Record<TestPolicy["complexity"], string> = {
  basic: "Quick overview — simpler content, shorter tests, shorter training.",
  intermediate: "Balanced depth and pace — the recommended default.",
  advanced: "In-depth coverage — richer content, harder tests, longer training.",
};

/** Maps a granular 0–100 material complexity value down to the 3 backend buckets. */
export function getComplexityBucket(score: number): TestPolicy["complexity"] {
  if (score <= 33) return "basic";
  if (score >= 67) return "advanced";
  return "intermediate";
}

/** A finer-grained label than the 3 backend buckets, for slider feedback. */
export function getMaterialComplexityLabel(score: number): string {
  if (score <= 20) return "Very basic";
  if (score <= 40) return "Basic";
  if (score <= 60) return "Intermediate";
  if (score <= 80) return "Advanced";
  return "Very advanced";
}
