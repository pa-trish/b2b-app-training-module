"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionRenderer } from "@/components/library/registry";
import { TestQuestionsPreview } from "@/components/manager/TestQuestionsPreview";
import { parseTestQuestions } from "@/lib/training/test-questions";
import { formatDayHeading } from "@/lib/training/day-title";
import type { ComponentSpec, TestQuestion } from "@/lib/types";

type PlanSection = {
  id: string;
  order: number;
  componentType: string;
  content: unknown;
};

type PlanModule = {
  id: string;
  order: number;
  title: string;
  estimatedMinutes: number;
  sections: PlanSection[];
  test: {
    id: string;
    questions: unknown;
    passPercent: number;
    maxAttempts: number;
    complexity: string;
    allowRetake: boolean;
  } | null;
};

type PlanDay = {
  id: string;
  dayNumber: number;
  title: string;
  summary: string;
  modules: PlanModule[];
};

type PlanProgram = {
  id: string;
  title: string;
  totalDays: number;
  status: string;
  days: PlanDay[];
};

export function ProgramPreview({ programId }: { programId: string }) {
  const searchParams = useSearchParams();
  const [program, setProgram] = useState<PlanProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDay, setActiveDay] = useState<string>("");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    fetch(`/api/programs/${programId}/plan`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.program) {
          setError(data.error || "Program not found");
          setLoading(false);
          return;
        }
        setProgram(data.program);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load program");
        setLoading(false);
      });
  }, [programId]);

  useEffect(() => {
    if (!program || initialized) return;

    const dayParam = searchParams.get("day");
    const moduleParam = searchParams.get("module");
    const dayData =
      program.days.find((d) => String(d.dayNumber) === dayParam) ?? program.days[0];

    if (dayData) {
      setActiveDay(String(dayData.dayNumber));
      const module =
        dayData.modules.find((m) => m.id === moduleParam) ?? dayData.modules[0] ?? null;
      setSelectedModuleId(module?.id ?? null);
    }

    setInitialized(true);
  }, [program, searchParams, initialized]);

  const activeDayData = useMemo(
    () => program?.days.find((d) => String(d.dayNumber) === activeDay),
    [program, activeDay]
  );

  const selectedModule = useMemo(() => {
    if (!activeDayData || !selectedModuleId) return null;
    return activeDayData.modules.find((m) => m.id === selectedModuleId) ?? null;
  }, [activeDayData, selectedModuleId]);

  const testQuestions: TestQuestion[] = selectedModule?.test
    ? parseTestQuestions(selectedModule.test.questions)
    : [];

  if (loading) {
    return <p className="text-muted-foreground">Loading program preview...</p>;
  }

  if (error || !program) {
    return <p className="text-destructive">{error || "Program not found"}</p>;
  }

  if (program.days.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No training plan yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Generate a training plan before previewing module content.
          </p>
          <Link href={`/manager/programs/${programId}`} className="mt-4 inline-block">
            <Button variant="outline">Back to program</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={`/manager/programs/${programId}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to program
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{program.title}</h1>
          <p className="text-muted-foreground">
            Program preview · {program.days.length} days · read-only
          </p>
        </div>
      </div>

      <Tabs
        value={activeDay}
        onValueChange={(day) => {
          setActiveDay(day);
          const dayData = program.days.find((d) => String(d.dayNumber) === day);
          setSelectedModuleId(dayData?.modules[0]?.id ?? null);
        }}
      >
        <TabsList className="flex h-auto flex-wrap justify-start">
          {program.days.map((day) => (
            <TabsTrigger key={day.id} value={String(day.dayNumber)}>
              Day {day.dayNumber}
            </TabsTrigger>
          ))}
        </TabsList>

        {program.days.map((day) => (
          <TabsContent key={day.id} value={String(day.dayNumber)} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {formatDayHeading(day.dayNumber, day.title)}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{day.summary}</p>
              </CardHeader>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Modules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {day.modules.map((module) => (
                    <Button
                      key={module.id}
                      variant={selectedModuleId === module.id ? "default" : "outline"}
                      className="h-auto w-full justify-start whitespace-normal py-2 text-left"
                      onClick={() => setSelectedModuleId(module.id)}
                    >
                      <span>
                        {module.order}. {module.title}
                        <span className="mt-1 block text-xs opacity-80">
                          {module.sections.length} sections · ~{module.estimatedMinutes} min
                        </span>
                      </span>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {selectedModule && String(day.dayNumber) === activeDay ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedModule.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      Module {selectedModule.order} · ~{selectedModule.estimatedMinutes} min
                    </p>
                  </div>

                  <div className="space-y-6">
                    {selectedModule.sections
                      .sort((a, b) => a.order - b.order)
                      .map((section) => {
                        const spec: ComponentSpec = {
                          componentType: section.componentType as ComponentSpec["componentType"],
                          content: section.content as Record<string, unknown>,
                        };
                        return (
                          <Card key={section.id}>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">
                                Section {section.order}: {section.componentType}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <SectionRenderer spec={spec} />
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>

                  {selectedModule.test ? (
                    <TestQuestionsPreview
                      questions={testQuestions}
                      passPercent={selectedModule.test.passPercent}
                      maxAttempts={selectedModule.test.maxAttempts}
                      complexity={selectedModule.test.complexity}
                    />
                  ) : null}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">Select a module to preview its content.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
