"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircleQuestion } from "lucide-react";

type QuestionToManagerProps = {
  disabled?: boolean;
  onSubmit: (body: string) => Promise<void>;
};

export function QuestionToManager({ disabled, onSubmit }: QuestionToManagerProps) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!body.trim()) return;
    setLoading(true);
    try {
      await onSubmit(body.trim());
      setSent(true);
      setBody("");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircleQuestion className="h-4 w-4" />
          Ask your manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sent ? (
          <p className="text-sm text-emerald-600">Question sent to your manager.</p>
        ) : null}
        {!open ? (
          <Button variant="outline" onClick={() => setOpen(true)} disabled={disabled}>
            Mark a question
          </Button>
        ) : (
          <>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What would you like to ask about this section?"
              rows={3}
              disabled={disabled}
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={loading || disabled || !body.trim()}>
                Send question
              </Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
