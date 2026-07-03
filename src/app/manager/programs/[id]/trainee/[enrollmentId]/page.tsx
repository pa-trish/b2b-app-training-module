import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getAuthAdapter } from "@/lib/auth/stub";
import { getEnrollmentLogs } from "@/lib/training/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function TraineeLogsPage({
  params,
}: {
  params: Promise<{ id: string; enrollmentId: string }>;
}) {
  const manager = await getAuthAdapter().requireManager();
  const { id, enrollmentId } = await params;
  const enrollment = await getEnrollmentLogs(enrollmentId, manager.id);

  if (!enrollment || enrollment.programId !== id) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{enrollment.trainee.name}</h1>
          <p className="text-muted-foreground">{enrollment.program.title}</p>
        </div>
        <Link href={`/manager/programs/${id}/preview/${enrollmentId}`}>
          <Button variant="secondary">Open trainee view</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollment.progress.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    Day {p.module.trainingDay.dayNumber}: {p.module.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.status.toLowerCase().replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    {p.startedAt ? format(p.startedAt, "MMM d, HH:mm") : "—"}
                  </TableCell>
                  <TableCell>
                    {p.completedAt ? format(p.completedAt, "MMM d, HH:mm") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test attempts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead>Attempt</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Finished</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollment.attempts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.moduleTest.module.title}</TableCell>
                  <TableCell>{a.attemptNumber}</TableCell>
                  <TableCell>{a.score != null ? `${a.score.toFixed(0)}%` : "—"}</TableCell>
                  <TableCell>{format(a.startedAt, "MMM d, HH:mm")}</TableCell>
                  <TableCell>
                    {a.finishedAt ? format(a.finishedAt, "MMM d, HH:mm") : "—"}
                  </TableCell>
                  <TableCell>
                    {a.passed == null ? "In progress" : a.passed ? "Passed" : "Failed"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {enrollment.logs.map((log) => (
            <div key={log.id} className="flex justify-between border-b py-2 text-sm">
              <span>
                {log.eventType.replace(/_/g, " ").toLowerCase()} · {log.entityType}
              </span>
              <span className="text-muted-foreground">
                {format(log.occurredAt, "MMM d, HH:mm:ss")}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trainee questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {enrollment.questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No questions yet.</p>
          ) : (
            enrollment.questions.map((q) => (
              <div key={q.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{q.module.title}</p>
                <p>{q.body}</p>
                <p className="text-muted-foreground">{format(q.createdAt, "MMM d, HH:mm")}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
