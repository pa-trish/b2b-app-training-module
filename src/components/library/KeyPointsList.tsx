"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

type KeyPointsContent = {
  title: string;
  points: string[];
};

export function KeyPointsList({ content }: { content: KeyPointsContent }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{content.title}</CardTitle>
        <button type="button" onClick={() => setExpanded(!expanded)} className="text-muted-foreground">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </CardHeader>
      {expanded ? (
        <CardContent>
          <ul className="list-disc space-y-2 pl-5">
            {content.points.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </CardContent>
      ) : null}
    </Card>
  );
}
