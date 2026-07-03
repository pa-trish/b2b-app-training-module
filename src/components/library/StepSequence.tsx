"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StepSequenceContent = {
  title: string;
  steps: string[];
};

export function StepSequence({ content }: { content: StepSequenceContent }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{content.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {content.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
