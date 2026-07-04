import { listAllActivityLogs, listAllUsers } from "@/lib/admin/access";
import { AdminLogsTable } from "@/components/admin/AdminLogsTable";
import { AdminUserTable } from "@/components/admin/AdminUserTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const defaultTab = tab === "logs" ? "logs" : "users";
  const [users, logs] = await Promise.all([listAllUsers(), listAllActivityLogs()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Administration</h1>
        <p className="text-muted-foreground">
          Manage user access, roles, and review application activity logs.
        </p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="logs">Activity logs ({logs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All users</CardTitle>
              <CardDescription>
                Assign or unassign users from the application and change their role.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminUserTable users={users} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity logs</CardTitle>
              <CardDescription>
                Latest training events across all enrollments (up to 200 entries).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminLogsTable logs={logs} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
