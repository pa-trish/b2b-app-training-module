"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { TestQuestion } from "@/lib/types";

type ModuleTestRunnerProps = {
  questions: TestQuestion[];
  passPercent: number;
  maxAttempts: number;
  attemptsUsed: number;
  lastPassed: boolean;
  allowRetake: boolean;
  disabled?: boolean;
  onSubmit: (answers: Record<string, string | boolean>) => Promise<{ score: number; passed: boolean }>;
};

export function ModuleTestRunner({
  questions,
  passPercent,
  maxAttempts,
  attemptsUsed,
  lastPassed,
  allowRetake,
  disabled,
  onSubmit,
}: ModuleTestRunnerProps) {
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const attemptsRemaining = maxAttempts - attemptsUsed;
  const canTakeTest =
    !disabled &&
    attemptsRemaining > 0 &&
    (!lastPassed || allowRetake) &&
    questions.length > 0;

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await onSubmit(answers);
      setResult(res);
    } finally {
      setLoading(false);
    }
  }

  if (questions.length === 0) {
    return <p className="text-sm text-muted-foreground">No test configured for this module.</p>;
  }

  if (!canTakeTest && lastPassed) {
    return (
      <Card className="border-emerald-300">
        <CardContent className="pt-6">
          <p className="text-emerald-700">You passed this module test. Great job!</p>
        </CardContent>
      </Card>
    );
  }

  if (!canTakeTest && attemptsRemaining <= 0) {
    return (
      <Card className="border-amber-300">
        <CardContent className="pt-6">
          <p className="text-amber-700">Maximum attempts reached. Contact your manager to reset.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Module test</CardTitle>
        <p className="text-sm text-muted-foreground">
          Pass score: {passPercent}% · Attempts left: {attemptsRemaining}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((q, index) => (
          <div key={q.id} className="space-y-2">
            <Label>
              {index + 1}. {q.question}
            </Label>
            {q.type === "true_false" ? (
              <div className="flex gap-2">
                {[true, false].map((val) => (
                  <Button
                    key={String(val)}
                    type="button"
                    variant={answers[q.id] === val ? "default" : "outline"}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                    disabled={Boolean(result) || disabled}
                  >
                    {val ? "True" : "False"}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {(q.options ?? []).map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={answers[q.id] === option ? "default" : "outline"}
                    className="h-auto w-full justify-start whitespace-normal py-2 text-left"
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: option }))}
                    disabled={Boolean(result) || disabled}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}

        {!result ? (
          <Button
            onClick={handleSubmit}
            disabled={loading || disabled || Object.keys(answers).length < questions.length}
          >
            {loading ? "Submitting..." : "Submit test"}
          </Button>
        ) : (
          <div className={result.passed ? "text-emerald-700" : "text-amber-700"}>
            Score: {result.score.toFixed(0)}% — {result.passed ? "Passed!" : "Not passed. Review and retry."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
