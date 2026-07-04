"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@prisma/client";
import { ADMIN_EMAIL } from "@/lib/admin/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string | Date;
  _count: {
    enrollments: number;
    managedPrograms: number;
    trainees: number;
  };
};

export function AdminUserTable({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function updateUser(userId: string, data: { role?: UserRole; isActive?: boolean }) {
    setLoadingId(userId);
    setError("");

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const body = await res.json();
    setLoadingId(null);

    if (!res.ok) {
      setError(body.error || "Update failed");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Access</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isProtectedAdmin = user.email === ADMIN_EMAIL;
            const roleOptions: UserRole[] = isProtectedAdmin
              ? ["ADMIN"]
              : ["MANAGER", "TRAINEE"];

            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {isProtectedAdmin ? (
                    <Badge>admin</Badge>
                  ) : (
                    <Select
                      value={user.role}
                      onValueChange={(value) =>
                        updateUser(user.id, { role: value as UserRole })
                      }
                      disabled={loadingId === user.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role.toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "Assigned" : "Unassigned"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {user.role === "MANAGER"
                    ? `${user._count.managedPrograms} programs · ${user._count.trainees} trainees`
                    : `${user._count.enrollments} enrollments`}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  {isProtectedAdmin ? (
                    <span className="text-xs text-muted-foreground">Protected</span>
                  ) : (
                    <Button
                      size="sm"
                      variant={user.isActive ? "outline" : "default"}
                      disabled={loadingId === user.id}
                      onClick={() =>
                        updateUser(user.id, { isActive: !user.isActive })
                      }
                    >
                      {user.isActive ? "Unassign" : "Assign"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
