import { apiError, jsonOk } from "@/lib/api/helpers";
import { AdminError, requireAdmin, updateAdminUser } from "@/lib/admin/access";
import type { UserRole } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const role = body.role as UserRole | undefined;
    const isActive = body.isActive as boolean | undefined;

    if (role && !["MANAGER", "TRAINEE", "ADMIN"].includes(role)) {
      throw new AdminError("Invalid role", 400);
    }

    const user = await updateAdminUser({
      adminId: admin.id,
      userId: id,
      role,
      isActive,
    });

    return jsonOk({ user });
  } catch (error) {
    return apiError(error);
  }
}
