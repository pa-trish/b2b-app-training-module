import { getAuthAdapter } from "@/lib/auth/stub";
import { redirect } from "next/navigation";
import { DayBriefing } from "@/components/trainee/DayBriefing";
import { requireEnrollmentPageAccess } from "@/lib/training/access";

export default async function DayPage({
  params,
  searchParams,
}: {
  params: Promise<{ enrollmentId: string; dayNumber: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const session = await getAuthAdapter().getSession();
  if (!session) redirect("/login");

  const { enrollmentId, dayNumber } = await params;
  const { preview } = await searchParams;

  await requireEnrollmentPageAccess(enrollmentId, session, {
    preview: preview === "1",
    requireActive: session.role === "trainee",
  });

  return (
    <DayBriefing
      enrollmentId={enrollmentId}
      dayNumber={Number(dayNumber)}
      preview={session.role === "manager"}
    />
  );
}
