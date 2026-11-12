import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/app/components/Icons";
import AppHeader from "@/app/components/panel-aula/AppHeader";
import AppSidebar from "@/app/components/panel-aula/AppSidebar";
import PostForm from "@/app/components/panel-aula/posts/PostForm";
import {
  MAIN_TOP_CLASS,
  SIDEBAR_OFFSET_CLASS,
} from "@/app/components/panel-aula/shell";
import { requireStaff } from "@/utils/auth";
import { getPostFormOptions } from "../queries";

export const metadata: Metadata = {
  title: "KiddiCare · Nueva Publicación",
  description: "Alta de una nueva publicación de aula para las familias.",
};

export default async function NuevaEntradaPage() {
  const profile = await requireStaff();
  const options = await getPostFormOptions(profile);

  return (
    <>
      <AppSidebar activePath="publicaciones" />
      <AppHeader />
      <main
        className={`relative ${MAIN_TOP_CLASS} ${SIDEBAR_OFFSET_CLASS} w-full bg-background min-h-screen font-body-md text-body-md`}
      >
        <div className="flex flex-col w-full px-8 pt-6 pb-16 space-y-6">
          <header className="flex flex-col gap-1.5">
            <Link
              className="inline-flex min-h-11 items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors self-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-lg"
              href="/panel-aula/entradas"
            >
              <Icon name="chevron_left" size={16} />
              <span>Volver a publicaciones</span>
            </Link>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Nueva publicación
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Completá el formulario para compartir una entrada con las familias.
            </p>
          </header>

          <PostForm options={options} />
        </div>
      </main>
    </>
  );
}
