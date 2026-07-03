import { redirect } from "next/navigation";
import { getAuthAdapter } from "@/lib/auth/stub";

export default async function HomePage() {
  const session = await getAuthAdapter().getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role === "manager") {
    redirect("/manager/dashboard");
  }
  redirect("/trainee");
}
