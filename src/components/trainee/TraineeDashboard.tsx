"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DayTimeline } from "@/components/library/DayTimeline";
import { StatusBadge } from "@/components/library/StatusBadge";
import type { ModuleStatus } from "@/lib/types";
import { Lock } from "lucide-react";

type Dashboard = {
  program: { title: string; totalDays: number };
  currentDay: number;
  progressPercent: number;
  days: Array<{
    dayNumber: number;
    title: string;
    summary: string;
    state: "locked" | "unlocked" | "completed";
    unlockDate: string;
    modules: Array<{ id: string; title: string; status: ModuleStatus; estimatedMinutes: number }>;
    allComplete: boolean;
  }>;
};

export function TraineeDashboard({ enrollmentId, preview }: { enrollmentId: string; preview?: boolean }) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/trainee/enrollments/${enrollmentId}/dashboard`)
      .then((r) => r.json())
      .then((data) => {
        setDashboard(data);
        setLoading(false);
      });
  }, [enrollmentId]);

  if (loading) return <p>Loading your training...</p>;
  if (!dashboard?.program) return <p>Training not found.</p>;

  const todayDay = dashboard.days.find((d) => d.dayNumber === dashboard.currentDay);
  const todayComplete = todayDay?.allComplete ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{dashboard.program.title}</h1>
        <p className="text-muted-foreground">
          Day {dashboard.currentDay} of {dashboard.program.totalDays}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Overall progress</span>
          <span>{dashboard.progressPercent}%</span>
        </div>
        <Progress value={dashboard.progressPercent} />
      </div>

      <DayTimeline
        basePath={`/trainee/${enrollmentId}`}
        days={dashboard.days.map((d) => ({
          dayNumber: d.dayNumber,
          title: d.title,
          state: d.state,
          href: d.state !== "locked" ? `/trainee/${enrollmentId}/day/${d.dayNumber}` : undefined,
        }))}
      />

      {todayDay && todayDay.state !== "locked" ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle>Today&apos;s training</CardTitle>
            <p className="text-sm text-muted-foreground">{todayDay.summary}</p>
          </CardHeader>
          <CardContent>
            {!todayComplete ? (
              <Link href={`/trainee/${enrollmentId}/day/${todayDay.dayNumber}`}>
                <Button>Start today&apos;s modules</Button>
              </Link>
            ) : (
              <p className="text-emerald-700">You completed all modules for today. Great work!</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        {dashboard.days
          .filter((d) => d.state !== "locked")
          .map((day) => (
            <Card key={day.dayNumber}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Day {day.dayNumber}: {day.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {day.modules.map((module) => (
                  <div
                    key={module.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{module.title}</p>
                      <p className="text-xs text-muted-foreground">~{module.estimatedMinutes} min</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={module.status} />
                      {!preview ? (
                        <Link href={`/trainee/${enrollmentId}/module/${module.id}`}>
                          <Button size="sm" variant="outline">
                            Open
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/trainee/${enrollmentId}/module/${module.id}?preview=1`}>
                          <Button size="sm" variant="outline">
                            Preview
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

        {dashboard.days
          .filter((d) => d.state === "locked")
          .map((day) => (
            <Card key={day.dayNumber} className="opacity-60">
              <CardContent className="flex items-center gap-2 pt-6 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                Day {day.dayNumber} unlocks on {day.unlockDate}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
