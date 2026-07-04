import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/credentials";
import { sendPasswordResetEmail } from "@/lib/email/send";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getAppUrl() {
  return process.env.APP_URL || process.env.AI_SITE_URL || "http://localhost:3000";
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return;
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const resetUrl = `${getAppUrl()}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail(user.email, resetUrl);
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  if (!token || newPassword.length < 6) {
    throw new PasswordResetError("Invalid reset request", 400);
  }

  const tokenHash = hashResetToken(token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    throw new PasswordResetError("Reset link is invalid or has expired", 400);
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: resetToken.userId } }),
  ]);

  return {
    role:
      resetToken.user.role === "ADMIN"
        ? "admin"
        : resetToken.user.role === "MANAGER"
          ? "manager"
          : "trainee",
  };
}

export class PasswordResetError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "PasswordResetError";
  }
}
