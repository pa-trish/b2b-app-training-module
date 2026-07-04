"use client";

import type { EnrollmentStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

const labels: Record<EnrollmentStatus, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  REMOVED: "Removed",
};

const variants: Record<
  EnrollmentStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  ACTIVE: "default",
  COMPLETED: "secondary",
  REMOVED: "outline",
};

export function EnrollmentStatusBadge({ status }: { status: EnrollmentStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}
