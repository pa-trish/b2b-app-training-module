import { getAuthAdapter } from "@/lib/auth/stub";
import { apiError, jsonOk } from "@/lib/api/helpers";
import { getManagerDashboard } from "@/lib/training/queries";

export async function GET() {
  try {
    const manager = await getAuthAdapter().requireManager();
    const programs = await getManagerDashboard(manager.id);
    return jsonOk({ programs });
  } catch (error) {
    return apiError(error);
  }
}
