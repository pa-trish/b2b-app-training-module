"use client";

import Link from "next/link";
import type { EnrollmentStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EnrollmentActions } from "@/components/manager/EnrollmentActions";
import { EnrollmentStatusBadge } from "@/components/manager/EnrollmentStatusBadge";
import { formatUserName } from "@/lib/users/trainee-name";

type TraineeEnrollment = {
  id: string;
  status: EnrollmentStatus;
  startDate: Date;
  trainee: {
    name: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
};

export function TraineeEnrollmentList({
  programId,
  enrollments,
}: {
  programId: string;
  enrollments: TraineeEnrollment[];
}) {
  const active = enrollments.filter((e) => e.status === "ACTIVE");
  const completed = enrollments.filter((e) => e.status === "COMPLETED");
  const removed = enrollments.filter((e) => e.status === "REMOVED");

  if (enrollments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No trainees assigned yet. Use the form above to add someone.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <EnrollmentSection title="Active" enrollments={active} programId={programId} />
      <EnrollmentSection title="Completed" enrollments={completed} programId={programId} />
      <EnrollmentSection title="Removed" enrollments={removed} programId={programId} dimmed />
    </div>
  );
}

function EnrollmentSection({
  title,
  enrollments,
  programId,
  dimmed,
}: {
  title: string;
  enrollments: TraineeEnrollment[];
  programId: string;
  dimmed?: boolean;
}) {
  if (enrollments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        {title} ({enrollments.length})
      </h3>
      {enrollments.map((enrollment) => (
        <Card key={enrollment.id} className={dimmed ? "opacity-70" : undefined}>
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{formatUserName(enrollment.trainee)}</p>
                <EnrollmentStatusBadge status={enrollment.status} />
              </div>
              <p className="text-sm text-muted-foreground">{enrollment.trainee.email}</p>
              <p className="text-xs text-muted-foreground">
                Start date: {new Date(enrollment.startDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <div className="flex flex-wrap gap-2">
                <Link href={`/manager/programs/${programId}/trainee/${enrollment.id}`}>
                  <Badge variant="outline">View logs</Badge>
                </Link>
                <Link href={`/manager/programs/${programId}/preview/${enrollment.id}`}>
                  <Badge variant="secondary">Trainee view</Badge>
                </Link>
              </div>
              <EnrollmentActions
                programId={programId}
                enrollmentId={enrollment.id}
                status={enrollment.status}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
