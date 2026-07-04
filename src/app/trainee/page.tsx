"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type Enrollment = {
  id: string;
  status?: string;
  program: { id: string; title: string; totalDays: number };
  progressPercent: number;
};

export default function TraineeHomePage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [completedEnrollments, setCompletedEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    fetch("/api/trainee/enrollments")
      .then((r) => r.json())
      .then((data) => {
        setEnrollments(data.enrollments ?? []);
        setCompletedEnrollments(data.completedEnrollments ?? []);
      });
  }, []);

  const hasAny = enrollments.length > 0 || completedEnrollments.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My training</h1>
        <p className="text-muted-foreground">Continue your daily learning path</p>
      </div>

      {!hasAny ? (
        <Card>
          <CardHeader>
            <CardTitle>No training assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Ask your manager to assign you to a program.</p>
          </CardContent>
        </Card>
      ) : null}

      {enrollments.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Active programs</h2>
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id}>
              <CardHeader>
                <CardTitle>{enrollment.program.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={enrollment.progressPercent} />
                <Link href={`/trainee/${enrollment.id}`}>
                  <Button>Continue training</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {completedEnrollments.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Completed programs</h2>
          {completedEnrollments.map((enrollment) => (
            <Card key={enrollment.id} className="opacity-80">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>{enrollment.program.title}</CardTitle>
                  <Badge variant="secondary">Completed</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={enrollment.progressPercent} />
                <p className="text-sm text-muted-foreground">
                  This training was marked complete by your manager.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
