import type { User } from "@prisma/client";

export type SessionUser = {
  userId: string;
  role: "admin" | "manager" | "trainee";
  email: string;
  name: string;
  previewEnrollmentId?: string;
};

export interface AuthAdapter {
  getSession(): Promise<SessionUser | null>;
  requireAdmin(): Promise<User>;
  requireManager(): Promise<User>;
  requireTrainee(): Promise<User>;
  requireUser(): Promise<User>;
  isPreviewMode(session: SessionUser): boolean;
}
