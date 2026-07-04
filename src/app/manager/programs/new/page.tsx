"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_TEST_POLICY,
  DEFAULT_MATERIAL_COMPLEXITY,
  MATERIAL_COMPLEXITY_MIN,
  MATERIAL_COMPLEXITY_MAX,
  MATERIAL_COMPLEXITY_STEP,
  COMPLEXITY_DESCRIPTIONS,
  COMPLEXITY_QUESTION_COUNTS,
  getComplexityBucket,
  getMaterialComplexityLabel,
} from "@/lib/types";
import { formatMinutes, suggestDays } from "@/lib/ai/generate-plan";
import {
  AI_PROVIDERS,
  DEFAULT_AI_PROVIDER,
  getAIProvider,
  suggestAIProvider,
  type AIProviderId,
} from "@/lib/ai/models";

const DEFAULT_DAILY_MINUTES = 150;
const steps = ["Name & Upload", "Configure", "Review"];

export default function NewProgramPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [programId, setProgramId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalWords, setTotalWords] = useState<number | null>(null);
  const [generation, setGeneration] = useState({
    status: "IDLE",
    progress: 0,
    error: null as string | null,
  });

  const [step0, setStep0] = useState({ title: "", files: null as FileList | null });

  const [form, setForm] = useState({
    totalDays: 3,
    dailyMinutes: DEFAULT_DAILY_MINUTES,
    timezone: "Europe/Warsaw",
    managerNotes: "",
    materialComplexity: DEFAULT_MATERIAL_COMPLEXITY,
    passPercent: DEFAULT_TEST_POLICY.passPercent,
    maxAttempts: DEFAULT_TEST_POLICY.maxAttempts,
    allowRetakeAfterPass: DEFAULT_TEST_POLICY.allowRetakeAfterPass,
  });

  const [aiProvider, setAiProvider] = useState<AIProviderId>(DEFAULT_AI_PROVIDER);
  const [aiProviderTouched, setAiProviderTouched] = useState(false);
  const selectedProvider = getAIProvider(aiProvider);
  const suggestedProvider = totalWords !== null ? suggestAIProvider(totalWords) : null;

  const computedSuggestedDays =
    totalWords !== null
      ? suggestDays(totalWords, form.dailyMinutes, form.materialComplexity)
      : null;

  async function createAndUpload() {
    if (!step0.title.trim()) {
      setError("Program title is required");
      return;
    }
    if (!step0.files?.length) {
      setError("Upload at least one document");
      return;
    }

    setLoading(true);
    setError("");

    // Step A: create program (minimal — days/config set in next step)
    const createRes = await fetch("/api/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: step0.title,
        totalDays: 3, // placeholder, updated in next step
        dailyMinutes: DEFAULT_DAILY_MINUTES,
        testPolicy: DEFAULT_TEST_POLICY,
      }),
    });
    const createData = await createRes.json();
    if (!createRes.ok) {
      setError(createData.error || "Failed to create program");
      setLoading(false);
      return;
    }

    const id = createData.program.id;
    setProgramId(id);

    // Step B: upload documents
    const formData = new FormData();
    Array.from(step0.files).forEach((f) => formData.append("files", f));
    const uploadRes = await fetch(`/api/programs/${id}/documents`, {
      method: "POST",
      body: formData,
    });
    const uploadData = await uploadRes.json();
    setLoading(false);

    if (!uploadRes.ok) {
      setError(uploadData.error || "Upload failed");
      return;
    }

    const failed = (uploadData.documents ?? []).filter(
      (doc: { parseStatus?: string }) => doc.parseStatus === "FAILED"
    );
    if (failed.length > 0) {
      const names = failed
        .map((doc: { fileName?: string }) => doc.fileName)
        .filter(Boolean)
        .join(", ");
      setError(
        names
          ? `Could not extract text from: ${names}. Supported formats: PDF, DOCX, TXT, MD.`
          : "Could not extract text from one or more uploaded files."
      );
      return;
    }

    const words = uploadData.stats?.totalWords ?? null;
    setTotalWords(words);

    if (words !== null) {
      const suggested = suggestDays(words, DEFAULT_DAILY_MINUTES, DEFAULT_MATERIAL_COMPLEXITY);
      setForm((prev) => ({ ...prev, totalDays: suggested }));
      if (!aiProviderTouched) {
        setAiProvider(suggestAIProvider(words));
      }
    }

    setStep(1);
  }

  async function saveConfigAndGenerate() {
    if (!programId) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/programs/${programId}/plan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        totalDays: form.totalDays,
        dailyMinutes: form.dailyMinutes,
        managerNotes: form.managerNotes,
        testPolicy: {
          complexity: getComplexityBucket(form.materialComplexity),
          materialComplexity: form.materialComplexity,
          passPercent: form.passPercent,
          maxAttempts: form.maxAttempts,
          allowRetakeAfterPass: form.allowRetakeAfterPass,
        },
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setLoading(false);
      setError(data.error || "Failed to save configuration");
      return;
    }

    setStep(2);
    setGeneration({ status: "PENDING", progress: 0, error: null });
    await fetch(`/api/programs/${programId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiProvider }),
    });
    pollGeneration();
  }

  function pollGeneration() {
    if (!programId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/programs/${programId}/generate`);
      const data = await res.json();
      setGeneration({
        status: data.generationStatus,
        progress: data.generationProgress,
        error: data.generationError,
      });
      if (data.generationStatus === "COMPLETED") {
        clearInterval(interval);
        setLoading(false);
      }
      if (data.generationStatus === "FAILED") {
        clearInterval(interval);
        setLoading(false);
        setError(data.generationError || "Generation failed");
      }
    }, 1500);
  }

  async function retryGeneration() {
    if (!programId) return;
    setLoading(true);
    setError("");
    setGeneration({ status: "PENDING", progress: 0, error: null });
    await fetch(`/api/programs/${programId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiProvider }),
    });
    pollGeneration();
  }

  async function publishProgram() {
    if (!programId) return;
    setLoading(true);
    const res = await fetch(`/api/programs/${programId}/publish`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Publish failed");
      return;
    }
    router.push(`/manager/programs/${programId}`);
  }

  const isBusy = generation.status === "PROCESSING" || generation.status === "PENDING";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New training program</h1>
        <p className="text-muted-foreground">
          Step {step + 1} of {steps.length}: {steps[step]}
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {/* Step 0: Name + Upload */}
      {step === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Name your program and upload documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Program title</Label>
              <Input
                value={step0.title}
                onChange={(e) => setStep0({ ...step0, title: e.target.value })}
                placeholder="Onboarding — Sales Team"
              />
            </div>
            <div className="space-y-2">
              <Label>Training documents</Label>
              <Input
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.md"
                onChange={(e) => setStep0({ ...step0, files: e.target.files })}
              />
              <p className="text-xs text-muted-foreground">
                Supported: PDF, DOCX, TXT, MD — we&apos;ll analyze the content to suggest a program length.
              </p>
            </div>
            <Button
              onClick={createAndUpload}
              disabled={loading || !step0.title.trim() || !step0.files?.length}
            >
              {loading ? "Uploading..." : "Upload and continue"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Step 1: Configure */}
      {step === 1 ? (
        <div className="space-y-4">
          {/* Document analysis summary */}
          {totalWords !== null ? (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="font-medium">📄 Document analysis</p>
                  <p className="text-sm text-muted-foreground">
                    ~{totalWords.toLocaleString()} words extracted
                    {computedSuggestedDays !== null
                      ? ` · Suggested length: ${computedSuggestedDays} day${computedSuggestedDays === 1 ? "" : "s"} at ${formatMinutes(form.dailyMinutes)}/day`
                      : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Program configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Daily learning time */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Learning time per day</Label>
                  <span className="text-sm font-medium text-primary">
                    {formatMinutes(form.dailyMinutes)}
                  </span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={720}
                  step={30}
                  value={form.dailyMinutes}
                  className="w-full accent-primary"
                  onChange={(e) => {
                    const mins = Number(e.target.value);
                    setForm((prev) => ({
                      ...prev,
                      dailyMinutes: mins,
                      totalDays:
                        totalWords !== null
                          ? suggestDays(totalWords, mins, prev.materialComplexity)
                          : prev.totalDays,
                    }));
                  }}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>30 min</span>
                  <span>6h</span>
                  <span>12h</span>
                </div>
              </div>

              {/* Material complexity */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Material complexity</Label>
                  <span className="text-sm font-medium text-primary">
                    {getMaterialComplexityLabel(form.materialComplexity)}
                  </span>
                </div>
                <input
                  type="range"
                  min={MATERIAL_COMPLEXITY_MIN}
                  max={MATERIAL_COMPLEXITY_MAX}
                  step={MATERIAL_COMPLEXITY_STEP}
                  value={form.materialComplexity}
                  className="w-full accent-primary"
                  onChange={(e) => {
                    const score = Number(e.target.value);
                    setForm((prev) => ({
                      ...prev,
                      materialComplexity: score,
                      totalDays:
                        totalWords !== null
                          ? suggestDays(totalWords, prev.dailyMinutes, score)
                          : prev.totalDays,
                    }));
                  }}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Basic</span>
                  <span>Intermediate</span>
                  <span>Advanced</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {COMPLEXITY_DESCRIPTIONS[getComplexityBucket(form.materialComplexity)]} ·{" "}
                  {COMPLEXITY_QUESTION_COUNTS[getComplexityBucket(form.materialComplexity)]} test
                  questions per module.
                </p>
              </div>

              {/* Number of days */}
              <div className="space-y-2">
                <Label>
                  Training days
                  {computedSuggestedDays !== null ? (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (suggested: {computedSuggestedDays})
                    </span>
                  ) : null}
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={form.totalDays}
                  onChange={(e) => setForm({ ...form, totalDays: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  Based on document length and your daily learning target — you can adjust freely.
                </p>
              </div>

              {/* Manager notes */}
              <div className="space-y-2">
                <Label>Notes for AI (optional)</Label>
                <Textarea
                  value={form.managerNotes}
                  onChange={(e) => setForm({ ...form, managerNotes: e.target.value })}
                  placeholder="Focus on product knowledge and CRM workflow..."
                />
              </div>

              {/* Test policy */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Pass threshold (%)</Label>
                  <Input
                    type="number"
                    min={50}
                    max={100}
                    value={form.passPercent}
                    onChange={(e) => setForm({ ...form, passPercent: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max attempts per test</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={form.maxAttempts}
                    onChange={(e) => setForm({ ...form, maxAttempts: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* AI model */}
              <div className="space-y-2">
                <Label>AI model</Label>
                <Select
                  value={aiProvider}
                  onValueChange={(value) => {
                    setAiProviderTouched(true);
                    setAiProvider(value as AIProviderId);
                  }}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDERS.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.label}
                        {suggestedProvider === provider.id ? " (suggested)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {selectedProvider.description} ({selectedProvider.model})
                </p>
                {suggestedProvider && suggestedProvider !== aiProvider ? (
                  <p className="text-xs text-primary">
                    Based on document size, we suggest {getAIProvider(suggestedProvider).label} for
                    more reliable results.
                  </p>
                ) : null}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)} disabled={loading}>
                  Back
                </Button>
                <Button onClick={saveConfigAndGenerate} disabled={loading}>
                  {loading ? "Starting..." : "Generate plan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Step 2: Review */}
      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {generation.status === "COMPLETED"
                ? "Plan ready"
                : generation.status === "FAILED"
                  ? "Generation failed"
                  : "Generating training plan"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            ) : null}

            {generation.status === "FAILED" ? (
              <>
                <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {generation.error || "Generation failed"}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                    Back to configuration
                  </Button>
                  <Button onClick={retryGeneration} disabled={loading}>
                    Retry generation
                  </Button>
                </div>
              </>
            ) : null}

            {generation.status === "COMPLETED" ? (
              <>
                <p className="text-muted-foreground">
                  Your {form.totalDays}-day training plan is ready. Review it before publishing.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/manager/programs/${programId}/preview`)}
                  >
                    Preview plan
                  </Button>
                  <Button onClick={publishProgram} disabled={loading}>
                    Publish program
                  </Button>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
