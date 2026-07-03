"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info, Lightbulb } from "lucide-react";

type CalloutContent = {
  variant: "tip" | "warning" | "remember";
  text: string;
};

const icons = {
  tip: Lightbulb,
  warning: AlertTriangle,
  remember: Info,
};

const titles = {
  tip: "Tip",
  warning: "Warning",
  remember: "Remember",
};

export function Callout({ content }: { content: CalloutContent }) {
  const Icon = icons[content.variant] ?? Info;
  return (
    <Alert>
      <Icon className="h-4 w-4" />
      <AlertTitle>{titles[content.variant] ?? "Note"}</AlertTitle>
      <AlertDescription>{content.text}</AlertDescription>
    </Alert>
  );
}
