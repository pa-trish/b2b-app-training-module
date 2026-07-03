"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type CheckpointContent = {
  question: string;
  options: string[];
  correctIndex: number;
};

export function CheckpointQuiz({ content }: { content: CheckpointContent }) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === content.correctIndex;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick checkpoint</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p>{content.question}</p>
        <div className="space-y-2">
          {content.options.map((option, i) => (
            <Button
              key={i}
              variant={selected === i ? "default" : "outline"}
              className="h-auto w-full justify-start whitespace-normal py-2 text-left"
              onClick={() => !answered && setSelected(i)}
              disabled={answered}
            >
              {option}
            </Button>
          ))}
        </div>
        {answered ? (
          <p className={isCorrect ? "text-emerald-600" : "text-amber-600"}>
            {isCorrect ? "Nice work!" : "Review the material and keep going."}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
