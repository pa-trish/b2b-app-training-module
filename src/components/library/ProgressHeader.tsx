"use client";

import { Progress } from "@/components/ui/progress";

export function ProgressHeader({
  currentSection,
  totalSections,
}: {
  currentSection: number;
  totalSections: number;
}) {
  const percent = totalSections === 0 ? 0 : Math.round((currentSection / totalSections) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>
          Section {currentSection} of {totalSections}
        </span>
        <span>{percent}%</span>
      </div>
      <Progress value={percent} />
    </div>
  );
}
