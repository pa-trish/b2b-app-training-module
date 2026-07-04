"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AI_PROVIDERS,
  DEFAULT_AI_PROVIDER,
  getAIProvider,
  type AIProviderId,
} from "@/lib/ai/models";
import { formatMinutes } from "@/lib/ai/generate-plan";

type GenerationStatus = "IDLE" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export function GeneratePlanPanel(props: {
  programId: string;
  totalDays: number;
  dailyMinutes: number;
  initialStatus: string;
  initialProgress: number;
  initialError: string | null;
}) {
  const router = useRouter();
  const [aiProvider, setAiProvider] = useState<AIProviderId>(DEFAULT_AI_PROVIDER);
  const [generation, setGeneration] = useState<{
    status: GenerationStatus;
    progress: number;
    error: string | null;
  }>({
    status: (props.initialStatus as GenerationStatus) || "IDLE",
    progress: props.initialProgress ?? 0,
    error: props.initialError,
  });
  const [loading, setLoading] = useState(props.initialStatus === "PROCESSING" || props.initialStatus === "PENDING");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedProvider = getAIProvider(aiProvider);

  useEffect(() => {
    if (generation.status === "PROCESSING" || generation.status === "PENDING") {
      pollGeneration();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pollGeneration() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      const res = await fetch(`/api/programs/${props.programId}/generate`);
      const data = await res.json();
      setGeneration({
        status: data.generationStatus,
        progress: data.generationProgress,
        error: data.generationError,
      });
      if (data.generationStatus === "COMPLETED") {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setLoading(false);
        router.refresh();
      }
      if (data.generationStatus === "FAILED") {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setLoading(false);
      }
    }, 1500);
  }

  async function startGeneration() {
    setLoading(true);
    setGeneration({ status: "PENDING", progress: 0, error: null });
    await fetch(`/api/programs/${props.programId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiProvider }),
    });
    pollGeneration();
  }

  const isBusy = generation.status === "PROCESSING" || generation.status === "PENDING";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {generation.status === "FAILED" ? "Retry plan generation" : "Generate training plan"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {generation.status === "FAILED" && generation.error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {generation.error}
          </p>
        ) : null}

        {isBusy ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Status: {generation.status} — {generation.progress}%
            </p>
            <div className="h-2 w-full rounded-full bg-secondary">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${generation.progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground">
              AI will build a {props.totalDays}-day plan with {formatMinutes(props.dailyMinutes)}{" "}
              of learning per day.
            </p>
            <div className="space-y-2">
              <Label>AI model</Label>
              <Select
                value={aiProvider}
                onValueChange={(value) => setAiProvider(value as AIProviderId)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {selectedProvider.description} ({selectedProvider.model})
              </p>
            </div>
          </>
        )}

        <Button onClick={startGeneration} disabled={loading}>
          {isBusy ? "Generating..." : generation.status === "FAILED" ? "Retry generation" : "Generate plan"}
        </Button>
      </CardContent>
    </Card>
  );
}
