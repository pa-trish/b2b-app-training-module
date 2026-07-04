import { getAuthAdapter } from "@/lib/auth/stub";
import { listManagerTrainees } from "@/lib/users/trainee";
import { CreateTraineeForm } from "@/components/manager/CreateTraineeForm";
import { TraineeDirectory } from "@/components/manager/TraineeDirectory";

export default async function ManagerTraineesPage() {
  const manager = await getAuthAdapter().requireManager();
  const trainees = await listManagerTrainees(manager.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trainees</h1>
        <p className="text-muted-foreground">
          Create trainee profiles once, then assign them to programs.
        </p>
      </div>

      <CreateTraineeForm />
      <TraineeDirectory trainees={trainees} />
    </div>
  );
}
