import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "be.snowbally+john@gmail.com";
  const user = await prisma.user.findUnique({ where: { email } });
  console.log("User:", JSON.stringify(user, null, 2));

  const fuzzy = await prisma.user.findMany({
    where: { email: { contains: "snowbally", mode: "insensitive" } },
  });
  console.log("Fuzzy:", JSON.stringify(fuzzy, null, 2));

  const managers = await prisma.user.findMany({
    where: { role: "MANAGER" },
    select: { id: true, email: true },
  });
  console.log("Managers:", JSON.stringify(managers, null, 2));

  if (user) {
    const enrollments = await prisma.enrollment.findMany({
      where: { traineeId: user.id },
      include: { program: { select: { id: true, title: true, managerId: true } } },
    });
    console.log("Enrollments:", JSON.stringify(enrollments, null, 2));

    const sameManager = await prisma.user.findMany({
      where: { role: "TRAINEE", managerId: user.managerId ?? undefined },
      select: { id: true, email: true, managerId: true },
    });
    console.log("Trainees same manager:", JSON.stringify(sameManager, null, 2));
  }

  const allTrainees = await prisma.user.findMany({
    where: { role: "TRAINEE" },
    select: { id: true, email: true, managerId: true },
  });
  console.log("All trainees:", JSON.stringify(allTrainees, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
