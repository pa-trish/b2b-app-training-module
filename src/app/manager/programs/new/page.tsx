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
import { DEFAULT_TEST_POLICY } from "@/lib/types";

const steps = ["Configure", "Upload", "Generate", "Review"];

export default function NewProgramPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [programId, setProgramId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generation, setGeneration] = useState({
    status: "IDLE",
    progress: 0,
    error: null as string | null,
  });

  const [form, setForm] = useState({
    title: "",
    totalDays: 5,
    timezone: "Europe/Warsaw",
    managerNotes: "",
    complexity: DEFAULT_TEST_POLICY.complexity,
    passPercent: DEFAULT_TEST_POLICY.passPercent,
    maxAttempts: DEFAULT_TEST_POLICY.maxAttempts,
    allowRetakeAfterPass: DEFAULT_TEST_POLICY.allowRetakeAfterPass,
  });

  const [files, setFiles] = useState<FileList | null>(null);

  async function createProgram() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        totalDays: form.totalDays,
        timezone: form.timezone,
        managerNotes: form.managerNotes,
        testPolicy: {
          complexity: form.complexity,
          passPercent: form.passPercent,
          maxAttempts: form.maxAttempts,
          allowRetakeAfterPass: form.allowRetakeAfterPass,
        },
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed to create program");
      return;
    }
    setProgramId(data.program.id);
    setStep(1);
  }

  async function uploadDocuments() {
    if (!programId || !files?.length) {
      setError("Select at least one document");
      return;
    }
    setLoading(true);
    setError("");
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    const res = await fetch(`/api/programs/${programId}/documents`, {
      method: "POST",
      body: formData,
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Upload failed");
      return;
    }
    setStep(2);
  }

  async function startGeneration() {
    if (!programId) return;
    setLoading(true);
    setError("");
    await fetch(`/api/programs/${programId}/generate`, { method: "POST" });
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
        setStep(3);
      }
      if (data.generationStatus === "FAILED") {
        clearInterval(interval);
        setLoading(false);
        setError(data.generationError || "Generation failed");
      }
    }, 1500);
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New training program</h1>
        <p className="text-muted-foreground">Step {step + 1} of {steps.length}: {steps[step]}</p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {step === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Program configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Program title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Onboarding — Sales Team"
              />
            </div>
            <div className="space-y-2">
              <Label>Training days available</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={form.totalDays}
                onChange={(e) => setForm({ ...form, totalDays: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Manager notes for AI</Label>
              <Textarea
                value={form.managerNotes}
                onChange={(e) => setForm({ ...form, managerNotes: e.target.value })}
                placeholder="Focus on product knowledge and CRM workflow..."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Test complexity</Label>
                <Select
                  value={form.complexity}
                  onValueChange={(v) =>
                    setForm({ ...form, complexity: v as typeof form.complexity })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                <Label>Max attempts</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={form.maxAttempts}
                  onChange={(e) => setForm({ ...form, maxAttempts: Number(e.target.value) })}
                />
              </div>
            </div>
            <Button onClick={createProgram} disabled={loading || !form.title}>
              Continue to upload
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload training documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.md"
              onChange={(e) => setFiles(e.target.files)}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button onClick={uploadDocuments} disabled={loading}>
                Upload and continue
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle>Generate training plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {generation.status === "IDLE" || generation.status === "PENDING" ? (
              <p className="text-muted-foreground">
                AI will build a {form.totalDays}-day plan with modules, interactive sections, and tests.
              </p>
            ) : (
              <p>
                Status: {generation.status} — {generation.progress}%
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={startGeneration} disabled={loading}>
                {loading ? "Generating..." : "Generate plan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <CardHeader>
            <CardTitle>Review and publish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your training plan is ready. Publish to assign trainees and unlock the trainee experience.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push(`/manager/programs/${programId}`)}>
                Review plan details
              </Button>
              <Button onClick={publishProgram} disabled={loading}>
                Publish program
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
