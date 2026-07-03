"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type ReflectionContent = {
  prompt: string;
};

export function ReflectionPrompt({ content }: { content: ReflectionContent }) {
  const [note, setNote] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reflection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p>{content.prompt}</p>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Your thoughts (saved locally for this session)..."
          rows={4}
        />
      </CardContent>
    </Card>
  );
}
