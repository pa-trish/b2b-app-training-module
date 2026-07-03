"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Quote } from "lucide-react";

type ExcerptContent = {
  quote: string;
  source?: string;
};

export function DocumentExcerpt({ content }: { content: ExcerptContent }) {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Quote className="h-4 w-4" />
          From the material
        </CardTitle>
      </CardHeader>
      <CardContent>
        <blockquote className="border-l-2 pl-4 italic">{content.quote}</blockquote>
        {content.source ? (
          <p className="mt-3 text-sm text-muted-foreground">— {content.source}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
