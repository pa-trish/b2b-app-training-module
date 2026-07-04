"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TraineeOption = {
  id: string;
  email: string;
  displayName: string;
};

export function EnrollTraineeForm({ programId }: { programId: string }) {
  const router = useRouter();
  const [trainees, setTrainees] = useState<TraineeOption[]>([]);
  const [traineeId, setTraineeId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTrainees, setLoadingTrainees] = useState(true);

  useEffect(() => {
    fetch("/api/manager/trainees")
      .then((r) => r.json())
      .then((data) => {
        setTrainees(data.trainees ?? []);
        setLoadingTrainees(false);
      })
      .catch(() => setLoadingTrainees(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!traineeId) {
      setMessage("Select a trainee");
      return;
    }

    setLoading(true);
    setMessage("");
    const res = await fetch(`/api/programs/${programId}/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ traineeId, startDate }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error || "Failed to assign trainee");
      return;
    }

    setMessage("Trainee assigned to program");
    setTraineeId("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Assign trainee</CardTitle>
      </CardHeader>
      <CardContent>
        {loadingTrainees ? (
          <p className="text-sm text-muted-foreground">Loading trainees...</p>
        ) : trainees.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Create a trainee profile first, then assign them to this program.
            </p>
            <Link href="/manager/trainees">
              <Button variant="outline">Go to trainees</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Trainee</Label>
              <Select value={traineeId} onValueChange={(value) => setTraineeId(value ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trainee" />
                </SelectTrigger>
                <SelectContent>
                  {trainees.map((trainee) => (
                    <SelectItem key={trainee.id} value={trainee.id}>
                      {trainee.displayName} ({trainee.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="flex items-end">
              <Link href="/manager/trainees" className="text-sm text-muted-foreground hover:text-foreground">
                Manage trainees
              </Link>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={loading || !traineeId}>
                {loading ? "Assigning..." : "Assign to program"}
              </Button>
              {message ? <p className="mt-2 text-sm text-muted-foreground">{message}</p> : null}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
