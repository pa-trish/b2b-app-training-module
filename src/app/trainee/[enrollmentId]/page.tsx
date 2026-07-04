import { getAuthAdapter } from "@/lib/auth/stub";
import { redirect } from "next/navigation";
import { TraineeDashboard } from "@/components/trainee/TraineeDashboard";
import { requireEnrollmentPageAccess } from "@/lib/training/access";

export default async function EnrollmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ enrollmentId: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const session = await getAuthAdapter().getSession();
  if (!session) redirect("/login");

  const { enrollmentId } = await params;
  const { preview } = await searchParams;

  await requireEnrollmentPageAccess(enrollmentId, session, {
    preview: preview === "1",
    requireActive: session.role === "trainee",
  });

  return (
    <TraineeDashboard
      enrollmentId={enrollmentId}
      preview={session.role === "manager"}
    />
  );
}
