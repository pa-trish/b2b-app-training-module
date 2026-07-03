import { NextResponse } from "next/server";
import { authenticateUser, hashPassword } from "@/lib/auth/credentials";
import { createSessionToken, setSessionCookie, clearSessionCookie } from "@/lib/auth/stub";
import { apiError, jsonOk } from "@/lib/api/helpers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createSessionToken(user);
    await setSessionCookie(token);

    return jsonOk({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role === "MANAGER" ? "manager" : "trainee",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE() {
  await clearSessionCookie();
  return jsonOk({ ok: true });
}

export { hashPassword };
