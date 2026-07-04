import { apiError, jsonOk } from "@/lib/api/helpers";
import { listAllActivityLogs, requireAdmin } from "@/lib/admin/access";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || 200), 500);

    const logs = await listAllActivityLogs(limit);
    return jsonOk({ logs });
  } catch (error) {
    return apiError(error);
  }
}
