import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Icon from "@/app/components/Icons";
import AppHeader from "@/app/components/panel-aula/AppHeader";
import AppSidebar from "@/app/components/panel-aula/AppSidebar";
import {
  MAIN_TOP_CLASS,
  SIDEBAR_OFFSET_CLASS,
} from "@/app/components/panel-aula/shell";
import { requireStaff } from "@/utils/auth";
import { getPostForEdit } from "../../queries";

export const metadata: Metadata = {
  title: "KiddiCare · Editar Publicación",
  description: "Edición de una publicación de aula para las familias.",
};

const ERROR_CLASSES =
  "rounded-xl border border-error/30 bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container";

type EditarEntradaPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarEntradaPage({
  params,
}: EditarEntradaPageProps) {
  await requireStaff();

  const { id } = await params;
  const { post, error } = await getPostForEdit(id);

  if (error) {
    return (
      <>
        <AppSidebar activePath="publicaciones" />
        <AppHeader />
        <main
          className={`relative ${MAIN_TOP_CLASS} ${SIDEBAR_OFFSET_CLASS} w-full bg-background min-h-screen font-body-md text-body-md`}
        >
          <div className="flex flex-col w-full px-8 pt-6 pb-16">
            <p className={ERROR_CLASSES} role="alert">
              {error}
            </p>
          </div>
        </main>
      </>
    );
  }

  if (!post || !post.canEdit) {
    notFound();
  }

  return (
    <>
        <AppSidebar activePath="publicaciones" />
        <AppHeader />
      <main
        className={`relative ${MAIN_TOP_CLASS} ${SIDEBAR_OFFSET_CLASS} w-full bg-background min-h-screen font-body-md text-body-md`}
      >
        <div className="flex flex-col w-full px-8 pt-6 pb-16 space-y-6">
          <header className="flex flex-col gap-1.5">
            <a
              className="inline-flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors self-start"
              href="/panel-aula/entradas"
            >
              <Icon name="chevron_left" size={16} />
              <span>Volver a publicaciones</span>
            </a>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Editar publicación
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {post.title}
            </p>
          </header>

          <section className="rounded-xl bg-surface-container-lowest p-6 shadow-sm font-body-sm text-body-sm text-on-surface-variant">
            El formulario de edición se habilita en un paso posterior de la implementación.
          </section>
        </div>
      </main>
    </>
  );
}
