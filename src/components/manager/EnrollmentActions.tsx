"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EnrollmentStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";

export function EnrollmentActions({
  programId,
  enrollmentId,
  status,
}: {
  programId: string;
  enrollmentId: string;
  status: EnrollmentStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (status !== "ACTIVE") {
    return null;
  }

  async function updateEnrollment(action: "complete" | "remove") {
    const label = action === "complete" ? "mark this training as complete" : "remove this trainee";
    if (!window.confirm(`Are you sure you want to ${label}?`)) {
      return;
    }

    setLoading(action);
    setError("");
    const res = await fetch(`/api/programs/${programId}/enrollments/${enrollmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setLoading(null);

    if (!res.ok) {
      setError(data.error || "Action failed");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={loading !== null}
          onClick={() => updateEnrollment("complete")}
        >
          {loading === "complete" ? "Saving..." : "Mark complete"}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={loading !== null}
          onClick={() => updateEnrollment("remove")}
        >
          {loading === "remove" ? "Removing..." : "Remove"}
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
