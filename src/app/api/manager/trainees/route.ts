import { getAuthAdapter } from "@/lib/auth/stub";
import { apiError, jsonOk } from "@/lib/api/helpers";
import { formatUserName } from "@/lib/users/trainee-name";
import { createManagerTrainee, listManagerTrainees } from "@/lib/users/trainee";

export async function GET() {
  try {
    const manager = await getAuthAdapter().requireManager();
    const trainees = await listManagerTrainees(manager.id);

    return jsonOk({
      trainees: trainees.map((trainee) => ({
        ...trainee,
        displayName: formatUserName(trainee),
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const manager = await getAuthAdapter().requireManager();
    const body = await request.json();

    const trainee = await createManagerTrainee({
      managerId: manager.id,
      firstName: String(body.firstName || ""),
      lastName: String(body.lastName || ""),
      email: String(body.email || ""),
      password: body.password ? String(body.password) : undefined,
    });

    return jsonOk(
      {
        trainee: {
          ...trainee,
          displayName: formatUserName(trainee),
        },
      },
      201
    );
  } catch (error) {
    return apiError(error);
  }
}
