"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TestQuestion } from "@/lib/types";

function formatAnswer(answer: string | boolean) {
  if (typeof answer === "boolean") {
    return answer ? "True" : "False";
  }
  return answer;
}

export function TestQuestionsPreview({
  questions,
  passPercent,
  maxAttempts,
  complexity,
}: {
  questions: TestQuestion[];
  passPercent: number;
  maxAttempts: number;
  complexity?: string;
}) {
  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">No test questions for this module.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Module test</CardTitle>
        <p className="text-sm text-muted-foreground">
          {questions.length} questions · {passPercent}% to pass · {maxAttempts} max attempts
          {complexity ? ` · ${complexity}` : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((q, index) => (
          <div key={q.id} className="space-y-3 rounded-md border p-4">
            <div className="flex items-start gap-2">
              <Badge variant="outline">{index + 1}</Badge>
              <p className="font-medium">{q.question}</p>
            </div>

            {q.type === "true_false" ? (
              <div className="flex gap-2 pl-8">
                {[true, false].map((val) => (
                  <Badge
                    key={String(val)}
                    variant={q.correctAnswer === val ? "default" : "outline"}
                  >
                    {val ? "True" : "False"}
                    {q.correctAnswer === val ? " ✓" : ""}
                  </Badge>
                ))}
              </div>
            ) : (
              <ul className="space-y-2 pl-8">
                {(q.options ?? []).map((option) => (
                  <li
                    key={option}
                    className={`rounded-md border px-3 py-2 text-sm ${
                      option === q.correctAnswer
                        ? "border-primary bg-primary/5 font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {option}
                    {option === q.correctAnswer ? (
                      <span className="ml-2 text-primary">Correct</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            <p className="pl-8 text-sm text-muted-foreground">
              Answer: {formatAnswer(q.correctAnswer)}
            </p>

            {q.explanation ? (
              <p className="pl-8 text-sm text-muted-foreground">{q.explanation}</p>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
