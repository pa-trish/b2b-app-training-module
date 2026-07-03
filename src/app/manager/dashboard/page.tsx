import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthAdapter } from "@/lib/auth/stub";
import { getManagerDashboard } from "@/lib/training/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default async function ManagerDashboardPage() {
  const manager = await getAuthAdapter().requireManager();
  const programs = await getManagerDashboard(manager.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trainer Dashboard</h1>
          <p className="text-muted-foreground">Manage programs and monitor trainee progress</p>
        </div>
        <Link href="/manager/programs/new">
          <Button>Create program</Button>
        </Link>
      </div>

      {programs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No programs yet</CardTitle>
            <CardDescription>Create your first training program to get started.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        programs.map((program) => (
          <Card key={program.id}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>{program.title}</CardTitle>
                <CardDescription>
                  {program.totalDays} days · {program.documentCount} documents ·{" "}
                  {program.traineeCount} trainees
                </CardDescription>
              </div>
              <Badge variant={program.status === "PUBLISHED" ? "default" : "secondary"}>
                {program.status.toLowerCase()}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Link href={`/manager/programs/${program.id}`}>
                  <Button variant="outline" size="sm">
                    View program
                  </Button>
                </Link>
              </div>

              {program.trainees.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-medium">Trainees</h3>
                  {program.trainees.map((trainee) => (
                    <div
                      key={trainee.enrollmentId}
                      className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">{trainee.name}</p>
                        <p className="text-sm text-muted-foreground">{trainee.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Day {trainee.currentDay} · {trainee.testAttempts} test attempts
                        </p>
                      </div>
                      <div className="w-full space-y-2 sm:w-48">
                        <Progress value={trainee.progressPercent} />
                        <div className="flex gap-2">
                          <Link href={`/manager/programs/${program.id}/trainee/${trainee.enrollmentId}`}>
                            <Button variant="outline" size="sm">
                              Logs
                            </Button>
                          </Link>
                          <Link href={`/manager/programs/${program.id}/preview/${trainee.enrollmentId}`}>
                            <Button variant="secondary" size="sm">
                              Trainee view
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No trainees assigned yet.</p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
