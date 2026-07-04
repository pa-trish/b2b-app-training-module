import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthAdapter } from "@/lib/auth/stub";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export default async function TraineeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthAdapter().getSession();
  if (!session) {
    redirect("/login");
  }

  const isPreview = session.role === "manager";

  return (
    <div className="min-h-full">
      {isPreview ? (
        <div className="bg-amber-100 px-6 py-2 text-center text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          Preview mode — you are viewing as a manager. Progress changes are disabled.
        </div>
      ) : null}
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/trainee" className="font-semibold">
            My Training
          </Link>
          {!isPreview ? (
            <div className="flex items-center gap-3">
              <Link href="/change-password">
                <Button variant="ghost" size="sm">
                  Change password
                </Button>
              </Link>
              <form action={logoutAction}>
                <Button variant="outline" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            </div>
          ) : (
            <Link href="/manager/dashboard">
              <Button variant="outline" size="sm">
                Back to trainer panel
              </Button>
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  );
}
