import OpenAI from "openai";
import { resolveAIModel } from "@/lib/ai/models";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export function getAIClient(): OpenAI | null {
  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) return null;

  const baseURL = process.env.AI_BASE_URL?.trim() || OPENROUTER_BASE_URL;
  const siteUrl = process.env.AI_SITE_URL?.trim();
  const appName = process.env.AI_APP_NAME?.trim() || "B2B Training Module";

  const defaultHeaders: Record<string, string> = {
    "X-Title": appName,
  };
  if (siteUrl) {
    defaultHeaders["HTTP-Referer"] = siteUrl;
  }

  return new OpenAI({
    apiKey,
    baseURL,
    defaultHeaders,
  });
}

export function getAIModel(providerId?: string | null): string {
  return resolveAIModel(providerId);
}
