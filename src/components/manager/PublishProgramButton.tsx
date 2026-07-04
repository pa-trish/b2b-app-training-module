"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PublishProgramButton({
  programId,
  size = "default",
  variant = "default",
}: {
  programId: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "secondary" | "outline";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePublish() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/programs/${programId}/publish`, { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Publish failed");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button type="button" size={size} variant={variant} onClick={handlePublish} disabled={loading}>
        {loading ? "Publishing..." : "Publish program"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
