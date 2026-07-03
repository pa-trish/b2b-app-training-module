export type TestPolicy = {
  complexity: "basic" | "intermediate" | "advanced";
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

export const DEFAULT_TEST_POLICY: TestPolicy = {
  complexity: "intermediate",
  passPercent: 70,
  maxAttempts: 3,
  allowRetakeAfterPass: false,
};

export const COMPLEXITY_QUESTION_COUNTS: Record<TestPolicy["complexity"], number> = {
  basic: 5,
  intermediate: 8,
  advanced: 10,
};
