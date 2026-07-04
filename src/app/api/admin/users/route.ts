import { apiError, jsonOk } from "@/lib/api/helpers";
import { listAllUsers, requireAdmin } from "@/lib/admin/access";

export async function GET() {
  try {
    await requireAdmin();
    const users = await listAllUsers();
    return jsonOk({ users });
  } catch (error) {
    return apiError(error);
  }
}
