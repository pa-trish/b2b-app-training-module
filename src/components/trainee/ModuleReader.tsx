"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionRenderer } from "@/components/library/registry";
import { ProgressHeader } from "@/components/library/ProgressHeader";
import { QuestionToManager } from "@/components/library/QuestionToManager";
import { ModuleTestRunner } from "@/components/library/ModuleTestRunner";
import type { ComponentSpec, TestQuestion } from "@/lib/types";

type ModuleData = {
  module: {
    id: string;
    title: string;
    dayNumber: number;
    sections: Array<{ id: string; order: number; componentType: string; content: unknown }>;
  };
  progress: {
    status: string;
    sectionsCompleted: number[];
  };
  test: {
    id: string;
    questions: TestQuestion[];
    passPercent: number;
    maxAttempts: number;
    allowRetake: boolean;
    attemptsUsed: number;
    lastPassed: boolean;
  } | null;
  enrollmentId: string;
};

export function ModuleReader({
  moduleId,
  enrollmentId,
  preview,
}: {
  moduleId: string;
  enrollmentId: string;
  preview?: boolean;
}) {
  const [data, setData] = useState<ModuleData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [showTest, setShowTest] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/trainee/modules/${moduleId}?enrollmentId=${enrollmentId}`)
      .then((r) => r.json())
      .then(setData);
  }, [moduleId, enrollmentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function markSectionComplete(sectionOrder: number) {
    if (preview) return;
    await fetch(`/api/trainee/modules/${moduleId}/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enrollmentId,
        sectionOrder,
        status: "in_progress",
      }),
    });
    load();
  }

  async function submitQuestion(body: string) {
    await fetch("/api/trainee/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enrollmentId,
        moduleId,
        sectionId: data?.module.sections[currentIndex]?.id,
        body,
      }),
    });
  }

  const allSectionsDone =
    data?.module.sections.every((s) => data.progress.sectionsCompleted.includes(s.order)) ?? false;

  if (!data?.module) return <p>Loading module...</p>;

  const sections = data.module.sections;
  const currentSection = sections[currentIndex];
  const spec: ComponentSpec = {
    componentType: currentSection.componentType as ComponentSpec["componentType"],
    content: currentSection.content as Record<string, unknown>,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/trainee/${enrollmentId}`} className="text-sm text-muted-foreground">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{data.module.title}</h1>
        <p className="text-sm text-muted-foreground">Day {data.module.dayNumber}</p>
      </div>

      {!showTest ? (
        <>
          <ProgressHeader currentSection={currentIndex + 1} totalSections={sections.length} />

          <SectionRenderer spec={spec} />

          {!preview ? <QuestionToManager onSubmit={submitQuestion} /> : null}

          <div className="flex justify-between">
            <Button
              variant="outline"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => i - 1)}
            >
              Previous
            </Button>
            {currentIndex < sections.length - 1 ? (
              <Button
                onClick={async () => {
                  await markSectionComplete(currentSection.order);
                  setCurrentIndex((i) => i + 1);
                }}
              >
                Next section
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  await markSectionComplete(currentSection.order);
                  setShowTest(true);
                }}
              >
                {allSectionsDone ? "Go to test" : "Finish sections & test"}
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          {data.test ? (
            <ModuleTestRunner
              questions={data.test.questions}
              passPercent={data.test.passPercent}
              maxAttempts={data.test.maxAttempts}
              attemptsUsed={data.test.attemptsUsed}
              lastPassed={data.test.lastPassed}
              allowRetake={data.test.allowRetake}
              disabled={preview}
              onSubmit={async (answers) => {
                if (!attemptId) {
                  const startRes = await fetch(
                    `/api/trainee/modules/${moduleId}/test/attempt`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ enrollmentId, action: "start" }),
                    }
                  );
                  const startData = await startRes.json();
                  setAttemptId(startData.attemptId);

                  const submitRes = await fetch(
                    `/api/trainee/modules/${moduleId}/test/attempt`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        enrollmentId,
                        action: "submit",
                        attemptId: startData.attemptId,
                        answers,
                      }),
                    }
                  );
                  const result = await submitRes.json();
                  load();
                  return { score: result.score, passed: result.passed };
                }

                const submitRes = await fetch(
                  `/api/trainee/modules/${moduleId}/test/attempt`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      enrollmentId,
                      action: "submit",
                      attemptId,
                      answers,
                    }),
                  }
                );
                const result = await submitRes.json();
                load();
                return { score: result.score, passed: result.passed };
              }}
            />
          ) : null}
          <Button variant="outline" onClick={() => setShowTest(false)}>
            Back to content
          </Button>
        </>
      )}
    </div>
  );
}
