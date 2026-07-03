"use client";

import { Badge } from "@/components/ui/badge";
import type { ModuleStatus } from "@/lib/types";

const styles: Record<ModuleStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  completed: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
};

const labels: Record<ModuleStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

export function StatusBadge({ status }: { status: ModuleStatus }) {
  return <Badge className={styles[status]}>{labels[status]}</Badge>;
}
