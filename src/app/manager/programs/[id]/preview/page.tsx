import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAuthAdapter } from "@/lib/auth/stub";
import { prisma } from "@/lib/db";
import { ProgramPreview } from "@/components/manager/ProgramPreview";

export default async function ProgramPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const manager = await getAuthAdapter().requireManager();
  const { id } = await params;

  const program = await prisma.trainingProgram.findFirst({
    where: { id, managerId: manager.id },
    select: { id: true },
  });

  if (!program) notFound();

  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading program preview...</p>}>
      <ProgramPreview programId={program.id} />
    </Suspense>
  );
}
