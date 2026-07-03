import { getAuthAdapter } from "@/lib/auth/stub";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { DayBriefing } from "@/components/trainee/DayBriefing";

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

  if (session.role === "manager" && preview === "1") {
    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, program: { managerId: session.userId } },
    });
    if (!enrollment) redirect("/manager/dashboard");
  } else if (session.role === "trainee") {
    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, traineeId: session.userId },
    });
    if (!enrollment) redirect("/trainee");
  } else {
    redirect("/login");
  }

  return (
    <DayBriefing
      enrollmentId={enrollmentId}
      dayNumber={Number(dayNumber)}
      preview={session.role === "manager"}
    />
  );
}
