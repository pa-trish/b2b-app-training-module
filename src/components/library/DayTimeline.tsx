"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Lock, CheckCircle2, Circle } from "lucide-react";
import type { DayUnlockState } from "@/lib/types";

export type DayTimelineItem = {
  dayNumber: number;
  title: string;
  state: DayUnlockState;
  href?: string;
};

export function DayTimeline({ days, basePath }: { days: DayTimelineItem[]; basePath: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {days.map((day) => {
        const content = (
          <div
            className={cn(
              "flex min-w-[120px] flex-col gap-1 rounded-lg border p-3 text-sm transition",
              day.state === "unlocked" && "border-primary bg-primary/5",
              day.state === "completed" && "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30",
              day.state === "locked" && "opacity-60"
            )}
          >
            <div className="flex items-center gap-1 font-medium">
              {day.state === "locked" ? (
                <Lock className="h-3.5 w-3.5" />
              ) : day.state === "completed" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-primary" />
              )}
              Day {day.dayNumber}
            </div>
            <span className="line-clamp-2 text-xs text-muted-foreground">{day.title}</span>
          </div>
        );

        if (day.state === "locked" || !day.href) {
          return <div key={day.dayNumber}>{content}</div>;
        }

        return (
          <Link key={day.dayNumber} href={day.href ?? `${basePath}/day/${day.dayNumber}`}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
