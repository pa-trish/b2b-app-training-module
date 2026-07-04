export const AI_PROVIDERS = [
  {
    id: "free",
    label: "Free",
    description: "OpenRouter free models — $0, best for testing",
    model: "openrouter/free",
  },
  {
    id: "google",
    label: "Google",
    description: "Gemini 2.0 Flash — fast and low cost",
    model: "google/gemini-2.0-flash-001",
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
    description: "Claude 3.5 Haiku — quick and affordable",
    model: "anthropic/claude-3.5-haiku",
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
