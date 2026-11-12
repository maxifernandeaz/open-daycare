import { redirect } from "next/navigation";
import FamilyFeed from "@/app/components/FamilyFeed";
import HomePortal from "@/app/components/HomePortal";
import {
  DEFAULT_PAGE,
  getFamilyFeed,
} from "@/app/panel-aula/entradas/queries";
import { getCurrentProfile } from "@/utils/auth";

type HomePageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

function parsePageValue(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;

  if (!raw) {
    return DEFAULT_PAGE;
  }

  const parsed = Number.parseInt(raw, 10);

  return Number.isNaN(parsed) ? DEFAULT_PAGE : parsed;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "tutor") {
    redirect("/panel-aula");
  }

  const { page } = await searchParams;
  const feed = await getFamilyFeed(parsePageValue(page));

  return <HomePortal feed={<FamilyFeed data={feed} />} />;
}
