"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Save, X } from "lucide-react";
import { formatDayHeading, stripDayPrefix } from "@/lib/training/day-title";

type Day = {
  id: string;
  dayNumber: number;
  title: string;
  summary: string;
  modules: Array<{
    id: string;
    order: number;
    title: string;
    estimatedMinutes: number;
    sections: Array<{ id: string; order: number; componentType: string }>;
    test: { id: string; complexity: string; passPercent: number; maxAttempts: number } | null;
  }>;
};

export function PlanEditor({
  programId,
  days: initialDays,
}: {
  programId: string;
  days: Day[];
}) {
  const [days, setDays] = useState<Day[]>(initialDays);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", summary: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function startEdit(day: Day) {
    setEditingDayId(day.id);
    setEditForm({ title: stripDayPrefix(day.title), summary: day.summary });
    setMessage("");
  }

  function cancelEdit() {
    setEditingDayId(null);
    setEditForm({ title: "", summary: "" });
  }

  async function saveDay(dayId: string) {
    setLoading(true);
    setMessage("");
    const res = await fetch(`/api/programs/${programId}/plan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        day: { id: dayId, title: editForm.title, summary: editForm.summary },
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error || "Save failed");
      return;
    }
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, title: editForm.title, summary: editForm.summary } : d
      )
    );
    setEditingDayId(null);
    setMessage("Day updated");
  }

  return (
    <div className="space-y-4">
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
      {days.map((day) => (
        <Card key={day.id}>
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="flex-1">
              {editingDayId === day.id ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Day title</Label>
                    <Input
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Day summary</Label>
                    <Textarea
                      value={editForm.summary}
                      onChange={(e) =>
                        setEditForm({ ...editForm, summary: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveDay(day.id)} disabled={loading}>
                      <Save className="mr-1 h-3 w-3" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                      <X className="mr-1 h-3 w-3" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <CardTitle className="text-lg">
                    {formatDayHeading(day.dayNumber, day.title)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{day.summary}</p>
                </>
              )}
            </div>
            {editingDayId !== day.id ? (
              <Button size="sm" variant="ghost" onClick={() => startEdit(day)}>
                <Pencil className="h-3 w-3" />
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-2">
            {day.modules.map((module) => (
              <div key={module.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">
                  {module.order}. {module.title} (~{module.estimatedMinutes} min)
                </p>
                <p className="text-muted-foreground">
                  {module.sections.length} sections · test: {module.test?.complexity ?? "none"} (
                  {module.test ? `${module.test.passPercent}% pass, ${module.test.maxAttempts} tries` : "no test"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}