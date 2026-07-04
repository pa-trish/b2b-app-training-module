import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AdminLog = {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  occurredAt: Date;
  actor: { email: string; name: string };
  trainee: { email: string; name: string };
  program: { title: string };
  enrollmentId: string;
};

export function AdminLogsTable({ logs }: { logs: AdminLog[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity logs yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Event</TableHead>
          <TableHead>Actor</TableHead>
          <TableHead>Trainee</TableHead>
          <TableHead>Program</TableHead>
          <TableHead>Entity</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="text-xs text-muted-foreground">
              {new Date(log.occurredAt).toLocaleString()}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{log.eventType.toLowerCase().replaceAll("_", " ")}</Badge>
            </TableCell>
            <TableCell>
              <div>
                <p className="text-sm">{log.actor.name}</p>
                <p className="text-xs text-muted-foreground">{log.actor.email}</p>
              </div>
            </TableCell>
            <TableCell>
              <div>
                <p className="text-sm">{log.trainee.name}</p>
                <p className="text-xs text-muted-foreground">{log.trainee.email}</p>
              </div>
            </TableCell>
            <TableCell className="max-w-48 truncate text-sm">{log.program.title}</TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {log.entityType}:{log.entityId}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
