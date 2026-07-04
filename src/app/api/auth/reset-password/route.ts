import { apiError, jsonOk } from "@/lib/api/helpers";
import { PasswordResetError, resetPasswordWithToken } from "@/lib/auth/password-reset";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body.token || "");
    const newPassword = String(body.newPassword || "");

    const result = await resetPasswordWithToken(token, newPassword);

    return jsonOk({ ok: true, role: result.role });
  } catch (error) {
    if (error instanceof PasswordResetError) {
      return jsonOk({ error: error.message }, error.status);
    }
    return apiError(error);
  }
}
