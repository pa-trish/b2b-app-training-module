import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthAdapter } from "@/lib/auth/stub";
import { logoutAction } from "@/lib/auth/actions";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthAdapter().getSession();
  if (!session || session.role !== "manager") {
    redirect("/login");
  }

  return (
    <div className="min-h-full">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/manager/dashboard" className="flex items-center gap-2 font-semibold">
              <LogoMark />
              Trainer Panel
            </Link>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/manager/dashboard">Dashboard</Link>
              <Link href="/manager/trainees">Trainees</Link>
              <Link href="/manager/programs/new">New program</Link>
            </nav>
          </div>
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
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
