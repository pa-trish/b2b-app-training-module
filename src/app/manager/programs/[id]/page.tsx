import { notFound } from "next/navigation";
import Link from "next/link";
import { getAuthAdapter } from "@/lib/auth/stub";
import { prisma } from "@/lib/db";
import { EnrollTraineeForm } from "@/components/manager/EnrollTraineeForm";
import { TraineeEnrollmentList } from "@/components/manager/TraineeEnrollmentList";
import { GeneratePlanPanel } from "@/components/manager/GeneratePlanPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDayHeading } from "@/lib/training/day-title";

export default async function ProgramDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const manager = await getAuthAdapter().requireManager();
  const { id } = await params;
  const { tab } = await searchParams;
  const defaultTab = tab === "trainees" ? "trainees" : "plan";

  const program = await prisma.trainingProgram.findFirst({
    where: { id, managerId: manager.id },
    include: {
      documents: true,
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: { sections: true, test: true },
          },
        },
      },
      enrollments: { include: { trainee: true } },
    },
  });

  if (!program) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{program.title}</h1>
          <p className="text-muted-foreground">
            {program.totalDays} days · {program.documents.length} documents
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {program.days.length > 0 ? (
            <Link href={`/manager/programs/${program.id}/preview`}>
              <Button variant="secondary">Preview program</Button>
            </Link>
          ) : null}
          <Badge>{program.status.toLowerCase()}</Badge>
        </div>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="plan">Training plan</TabsTrigger>
          <TabsTrigger value="trainees">Trainees</TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="space-y-4">
          {program.days.length === 0 ? (
            <GeneratePlanPanel
              programId={program.id}
              totalDays={program.totalDays}
              dailyMinutes={program.dailyMinutes}
              initialStatus={program.generationStatus}
              initialProgress={program.generationProgress}
              initialError={program.generationError}
            />
          ) : null}
          {program.days.map((day) => (
            <Card key={day.id}>
              <CardHeader>
                <CardTitle>
                  {formatDayHeading(day.dayNumber, day.title)}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{day.summary}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {day.modules.map((module) => (
                  <div key={module.id} className="flex flex-col gap-2 rounded-md border p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">
                        {module.order}. {module.title} (~{module.estimatedMinutes} min)
                      </p>
                      <p className="text-muted-foreground">
                        {module.sections.length} sections · test: {module.test?.complexity} (
                        {module.test?.passPercent}% pass, {module.test?.maxAttempts} tries)
                      </p>
                    </div>
                    <Link href={`/manager/programs/${program.id}/preview?day=${day.dayNumber}&module=${module.id}`}>
                      <Button variant="outline" size="sm">
                        Preview
                      </Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="trainees" className="space-y-4">
          {program.status === "PUBLISHED" ? (
            <EnrollTraineeForm programId={program.id} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Publish the program before assigning trainees.
            </p>
          )}
          <TraineeEnrollmentList programId={program.id} enrollments={program.enrollments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
