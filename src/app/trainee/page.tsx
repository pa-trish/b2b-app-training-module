"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Enrollment = {
  id: string;
  program: { id: string; title: string; totalDays: number };
  progressPercent: number;
};

export default function TraineeHomePage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    fetch("/api/trainee/enrollments")
      .then((r) => r.json())
      .then((data) => setEnrollments(data.enrollments ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My training</h1>
        <p className="text-muted-foreground">Continue your daily learning path</p>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No active training</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Ask your manager to assign you to a program.</p>
          </CardContent>
        </Card>
      ) : (
        enrollments.map((enrollment) => (
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
        ))
      )}
    </div>
  );
}
