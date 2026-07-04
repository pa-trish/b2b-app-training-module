export const AI_PROVIDERS = [
  {
    id: "free",
    label: "Free",
    description: "OpenRouter free router — $0, best for testing (auto-selects an available free model)",
    model: "openrouter/free",
  },
  {
    id: "google",
    label: "Google",
    description: "Gemini 3.5 Flash — fast and cost-effective",
    model: "google/gemini-3.5-flash",
  },
  {
    id: "openai",
    label: "OpenAI",
    description: "GPT-4o mini — balanced quality and cost",
    model: "openai/gpt-4o-mini",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    description: "Claude Haiku 4.5 — quick and affordable",
    model: "anthropic/claude-haiku-4-5",
  },
] as const;

export type AIProviderId = (typeof AI_PROVIDERS)[number]["id"];

export const DEFAULT_AI_PROVIDER: AIProviderId = "free";

export function isAIProviderId(value: string): value is AIProviderId {
  return AI_PROVIDERS.some((provider) => provider.id === value);
}

export function resolveAIModel(providerId?: string | null): string {
  if (providerId) {
    const provider = AI_PROVIDERS.find((entry) => entry.id === providerId);
    if (provider) return provider.model;
  }

  return process.env.AI_MODEL?.trim() || AI_PROVIDERS[0].model;
}

export function getAIProvider(providerId: AIProviderId) {
  return AI_PROVIDERS.find((entry) => entry.id === providerId)!;
}

/**
 * Suggest an AI provider based on document size. Larger documents produce
 * bigger per-day prompts, which free/small models are more likely to
 * truncate or mishandle — so bump up to a stronger paid model past a
 * word-count threshold.
 */
export function suggestAIProvider(totalWords: number | null): AIProviderId {
  if (totalWords === null) return DEFAULT_AI_PROVIDER;
  if (totalWords > 6000) return "google";
  return DEFAULT_AI_PROVIDER;
}
