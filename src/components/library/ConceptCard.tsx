"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ConceptCardContent = {
  term: string;
  definition: string;
  example?: string;
};

export function ConceptCard({ content }: { content: ConceptCardContent }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{content.term}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p>{content.definition}</p>
        {content.example ? (
          <p className="rounded-md bg-muted p-3 text-sm italic">Example: {content.example}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
