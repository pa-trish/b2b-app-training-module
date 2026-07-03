"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

type HeroIntroContent = {
  title: string;
  goal: string;
  estimatedMinutes?: number;
};

export function HeroIntro({ content }: { content: HeroIntroContent }) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <CardTitle className="text-2xl">{content.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground">{content.goal}</p>
        {content.estimatedMinutes ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            ~{content.estimatedMinutes} min
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
