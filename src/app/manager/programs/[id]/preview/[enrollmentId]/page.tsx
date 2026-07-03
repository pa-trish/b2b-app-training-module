import { redirect } from "next/navigation";

export default async function PreviewTraineePage({
  params,
}: {
  params: Promise<{ id: string; enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  redirect(`/trainee/${enrollmentId}?preview=1`);
}
