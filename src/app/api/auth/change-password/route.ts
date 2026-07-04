import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/credentials";
import { getAuthAdapter } from "@/lib/auth/stub";
import { prisma } from "@/lib/db";
import { apiError, jsonOk } from "@/lib/api/helpers";

export async function POST(request: Request) {
  try {
    const auth = getAuthAdapter();
    const session = await auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new password required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
      },
    });

    return jsonOk({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}