import { apiError, jsonOk } from "@/lib/api/helpers";
import { requestPasswordReset } from "@/lib/auth/password-reset";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "");

    if (!email.trim()) {
      return jsonOk({ error: "Email is required" }, 400);
    }

    await requestPasswordReset(email);

    return jsonOk({
      ok: true,
      message: "If an account exists for that email, a reset link has been sent.",
    });
  } catch (error) {
    return apiError(error);
  }
}
