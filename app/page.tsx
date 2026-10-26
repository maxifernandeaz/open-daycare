import { redirect } from "next/navigation";
import HomePortal from "@/app/components/HomePortal";
import { getCurrentProfile } from "@/utils/auth";

export default async function HomePage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "tutor") {
    redirect("/panel-aula");
  }

  return <HomePortal />;
}
