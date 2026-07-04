import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/stub";
import { EnrollmentError } from "@/lib/training/enrollment";
import { TraineeError } from "@/lib/users/trainee";
import { AdminError } from "@/lib/admin/access";

export function apiError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof AdminError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof EnrollmentError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof TraineeError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ error: "Unknown error" }, { status: 500 });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
