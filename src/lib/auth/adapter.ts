import type { User } from "@prisma/client";

export type SessionUser = {
  userId: string;
  role: "manager" | "trainee";
  email: string;
  name: string;
  previewEnrollmentId?: string;
};

export interface AuthAdapter {
  getSession(): Promise<SessionUser | null>;
  requireManager(): Promise<User>;
  requireTrainee(): Promise<User>;
  requireUser(): Promise<User>;
  isPreviewMode(session: SessionUser): boolean;
}
