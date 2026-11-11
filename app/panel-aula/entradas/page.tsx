import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/app/components/Icons";
import AppHeader from "@/app/components/panel-aula/AppHeader";
import AppSidebar from "@/app/components/panel-aula/AppSidebar";
import PostList from "@/app/components/panel-aula/posts/PostList";
import {
  MAIN_TOP_CLASS,
  SIDEBAR_OFFSET_CLASS,
} from "@/app/components/panel-aula/shell";
import { requireStaff } from "@/utils/auth";
import { DEFAULT_PAGE, getStaffPosts } from "./queries";

export const metadata: Metadata = {
  title: "KiddiCare · Publicaciones de Aula",
  description:
    "Gestión de las publicaciones del aula: actividades, avisos, menús y fotos para las familias.",
};

const NEW_POST_CLASSES =
  "inline-flex min-h-11 items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

type EntradasPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function parsePage(value: string | string[] | undefined): number {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) {
    return DEFAULT_PAGE;
  }

  const parsed = Number.parseInt(rawValue, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PAGE;
}

export default async function EntradasPage({
  searchParams,
}: EntradasPageProps) {
  await requireStaff();

  const params = await searchParams;
  const data = await getStaffPosts(parsePage(params.page));

  return (
    <>
      <AppSidebar activePath="publicaciones" />
      <AppHeader />
      <main
        className={`relative ${MAIN_TOP_CLASS} ${SIDEBAR_OFFSET_CLASS} w-full bg-background min-h-screen font-body-md text-body-md`}
      >
        <div className="flex flex-col w-full px-8 pt-6 pb-16 space-y-6">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Publicaciones de Aula
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Compartí actividades, avisos, menús y fotos con las familias.
              </p>
            </div>
            <Link
              className={`${NEW_POST_CLASSES} self-start md:self-auto shrink-0`}
              href="/panel-aula/entradas/nueva"
            >
              <Icon name="add" size={20} />
              <span>Nueva publicación</span>
            </Link>
          </header>

          <PostList data={data} />
        </div>
      </main>
    </>
  );
}
