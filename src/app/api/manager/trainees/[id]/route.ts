import { getAuthAdapter } from "@/lib/auth/stub";
import { apiError, jsonOk } from "@/lib/api/helpers";
import { formatUserName } from "@/lib/users/trainee-name";
import { updateManagerTrainee } from "@/lib/users/trainee";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const manager = await getAuthAdapter().requireManager();
    const { id } = await params;
    const body = await request.json();

    const trainee = await updateManagerTrainee({
      managerId: manager.id,
      traineeId: id,
      firstName: String(body.firstName || ""),
      lastName: String(body.lastName || ""),
    });

    return jsonOk({
      trainee: {
        ...trainee,
        displayName: formatUserName(trainee),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
