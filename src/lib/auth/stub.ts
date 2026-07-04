import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuthAdapter, SessionUser } from "./adapter";
import { ADMIN_EMAIL } from "@/lib/admin/constants";

const SESSION_COOKIE = "training_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

function sessionRole(user: User): SessionUser["role"] {
  if (user.role === "ADMIN") return "admin";
  if (user.role === "MANAGER") return "manager";
  return "trainee";
}

export async function createSessionToken(user: User): Promise<string> {
  return new SignJWT({
    userId: user.id,
    role: sessionRole(user),
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

async function readSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.userId as string,
      role: payload.role as SessionUser["role"],
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export const stubAuthAdapter: AuthAdapter = {
  async getSession() {
    return readSession();
  },

  async requireUser() {
    const session = await readSession();
    if (!session) {
      throw new AuthError("Unauthorized", 401);
    }
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || !user.isActive) {
      throw new AuthError("Unauthorized", 401);
    }
    return user;
  },

  async requireAdmin() {
    const user = await this.requireUser();
    if (user.role !== "ADMIN" || user.email !== ADMIN_EMAIL) {
      throw new AuthError("Forbidden", 403);
    }
    return user;
  },

  async requireManager() {
    const user = await this.requireUser();
    if (user.role !== "MANAGER") {
      throw new AuthError("Forbidden", 403);
    }
    return user;
  },

  async requireTrainee() {
    const user = await this.requireUser();
    if (user.role !== "TRAINEE") {
      throw new AuthError("Forbidden", 403);
    }
    return user;
  },

  isPreviewMode(session: SessionUser) {
    return Boolean(session.previewEnrollmentId);
  },
};

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getAuthAdapter(): AuthAdapter {
  return stubAuthAdapter;
}
