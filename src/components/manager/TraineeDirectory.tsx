"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatUserName } from "@/lib/users/trainee-name";

type Trainee = {
  id: string;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  enrollments: Array<{ id: string; status: string; program: { title: string } }>;
};

export function TraineeDirectory({ trainees }: { trainees: Trainee[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function startEdit(trainee: Trainee) {
    setEditingId(trainee.id);
    setEditForm({
      firstName: trainee.firstName ?? trainee.name.split(" ")[0] ?? "",
      lastName: trainee.lastName ?? trainee.name.split(" ").slice(1).join(" "),
    });
    setMessage("");
  }

  async function saveEdit(traineeId: string) {
    setLoading(true);
    setMessage("");
    const res = await fetch(`/api/manager/trainees/${traineeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error || "Update failed");
      return;
    }

    setEditingId(null);
    setMessage("Trainee updated");
    router.refresh();
  }

  if (trainees.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            No trainees yet. Create a trainee profile before assigning programs.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {trainees.map((trainee) => (
        <Card key={trainee.id}>
          <CardContent className="pt-6">
            {editingId === trainee.id ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 sm:col-span-2">
                  <Button size="sm" onClick={() => saveEdit(trainee.id)} disabled={loading}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{formatUserName(trainee)}</p>
                  <p className="text-sm text-muted-foreground">{trainee.email}</p>
                  {trainee.enrollments.length > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {trainee.enrollments.length} program assignment
                      {trainee.enrollments.length === 1 ? "" : "s"}
                    </p>
                  ) : null}
                </div>
                <Button size="sm" variant="outline" onClick={() => startEdit(trainee)}>
                  Edit name
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
