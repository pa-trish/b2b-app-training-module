import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthAdapter } from "@/lib/auth/stub";
import { prisma } from "@/lib/db";
import { EnrollTraineeForm } from "@/components/manager/EnrollTraineeForm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const manager = await getAuthAdapter().requireManager();
  const { id } = await params;

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{program.title}</h1>
          <p className="text-muted-foreground">
            {program.totalDays} days · {program.documents.length} documents
          </p>
        </div>
        <Badge>{program.status.toLowerCase()}</Badge>
      </div>

      <Tabs defaultValue="plan">
        <TabsList>
          <TabsTrigger value="plan">Training plan</TabsTrigger>
          <TabsTrigger value="trainees">Trainees</TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="space-y-4">
          {program.days.map((day) => (
            <Card key={day.id}>
              <CardHeader>
                <CardTitle>
                  Day {day.dayNumber}: {day.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{day.summary}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {day.modules.map((module) => (
                  <div key={module.id} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">
                      {module.order}. {module.title} (~{module.estimatedMinutes} min)
                    </p>
                    <p className="text-muted-foreground">
                      {module.sections.length} sections · test: {module.test?.complexity} (
                      {module.test?.passPercent}% pass, {module.test?.maxAttempts} tries)
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="trainees" className="space-y-4">
          {program.status === "PUBLISHED" ? <EnrollTraineeForm programId={program.id} /> : null}
          {program.enrollments.map((enrollment) => (
            <Card key={enrollment.id}>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="font-medium">{enrollment.trainee.name}</p>
                  <p className="text-sm text-muted-foreground">{enrollment.trainee.email}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/manager/programs/${program.id}/trainee/${enrollment.id}`}>
                    <Badge variant="outline">View logs</Badge>
                  </Link>
                  <Link href={`/manager/programs/${program.id}/preview/${enrollment.id}`}>
                    <Badge variant="secondary">Trainee view</Badge>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
