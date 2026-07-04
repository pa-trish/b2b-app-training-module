import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/access";
import { ADMIN_EMAIL } from "@/lib/admin/constants";
import { logoutAction } from "@/lib/auth/actions";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-full">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
              <LogoMark />
              Admin Panel
            </Link>
            <p className="text-sm text-muted-foreground">{ADMIN_EMAIL}</p>
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
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
