import { redirect } from "next/navigation";
import { getAuthAdapter } from "@/lib/auth/stub";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export default async function ChangePasswordPage() {
  const session = await getAuthAdapter().getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <ChangePasswordForm />
    </div>
  );
}