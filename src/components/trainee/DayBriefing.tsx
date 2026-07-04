"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/library/StatusBadge";
import { formatDayHeading } from "@/lib/training/day-title";
import type { ModuleStatus } from "@/lib/types";

type DayData = {
  dayNumber: number;
  title: string;
  summary: string;
  modules: Array<{ id: string; title: string; status: ModuleStatus; estimatedMinutes: number }>;
};

export function DayBriefing({
  enrollmentId,
  dayNumber,
  preview,
}: {
  enrollmentId: string;
  dayNumber: number;
  preview?: boolean;
}) {
  const [day, setDay] = useState<DayData | null>(null);

  useEffect(() => {
    fetch(`/api/trainee/enrollments/${enrollmentId}/dashboard`)
      .then((r) => r.json())
      .then((data) => {
        const found = data.days?.find((d: { dayNumber: number }) => d.dayNumber === dayNumber);
        if (found) {
          setDay({
            dayNumber: found.dayNumber,
            title: found.title,
            summary: found.summary,
            modules: found.modules,
          });
        }
      });
  }, [enrollmentId, dayNumber]);

  if (!day) return <p>Loading day briefing...</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/trainee/${enrollmentId}`} className="text-sm text-muted-foreground">
          ← Back to timeline
        </Link>
        <h1 className="mt-2 text-3xl font-bold">
          {formatDayHeading(day.dayNumber, day.title)}
        </h1>
        <p className="text-muted-foreground">{day.summary}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your modules for today</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {day.modules.map((module) => (
            <div key={module.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">{module.title}</p>
                <p className="text-xs text-muted-foreground">~{module.estimatedMinutes} min</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={module.status} />
                <Link
                  href={`/trainee/${enrollmentId}/module/${module.id}${preview ? "?preview=1" : ""}`}
                >
                  <Button size="sm">{module.status === "completed" ? "Review" : "Start"}</Button>
                </Link>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
