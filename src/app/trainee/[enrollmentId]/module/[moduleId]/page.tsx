import { getAuthAdapter } from "@/lib/auth/stub";
import { redirect } from "next/navigation";
import { ModuleReader } from "@/components/trainee/ModuleReader";
import { requireEnrollmentPageAccess } from "@/lib/training/access";

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ enrollmentId: string; moduleId: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const session = await getAuthAdapter().getSession();
  if (!session) redirect("/login");

  const { enrollmentId, moduleId } = await params;
  const { preview } = await searchParams;

  await requireEnrollmentPageAccess(enrollmentId, session, {
    preview: preview === "1",
    requireActive: session.role === "trainee",
  });

  return (
    <ModuleReader
      moduleId={moduleId}
      enrollmentId={enrollmentId}
      preview={session.role === "manager"}
    />
  );
}
