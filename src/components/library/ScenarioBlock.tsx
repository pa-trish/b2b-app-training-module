"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ScenarioContent = {
  situation: string;
  action: string;
  outcome: string;
};

export function ScenarioBlock({ content }: { content: ScenarioContent }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Situation</p>
          <p>{content.situation}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Action</p>
          <p>{content.action}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Outcome</p>
          <p>{content.outcome}</p>
        </div>
      </CardContent>
    </Card>
  );
}
