import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const { reset } = await searchParams;
  const resetSuccess = reset === "1";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      {resetSuccess ? (
        <p className="text-sm text-muted-foreground">
          Your password has been reset. Sign in with your new password.
        </p>
      ) : null}
      <LoginForm />
    </div>
  );
}
