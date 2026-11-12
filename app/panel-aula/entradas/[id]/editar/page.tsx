import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/app/components/Icons";
import AppHeader from "@/app/components/panel-aula/AppHeader";
import AppSidebar from "@/app/components/panel-aula/AppSidebar";
import PostForm from "@/app/components/panel-aula/posts/PostForm";
import type { PostFormInitialData } from "@/app/components/panel-aula/posts/PostForm";
import {
  MAIN_TOP_CLASS,
  SIDEBAR_OFFSET_CLASS,
} from "@/app/components/panel-aula/shell";
import { requireStaff } from "@/utils/auth";
import { getPostForEdit, getPostFormOptions } from "../../queries";

export const metadata: Metadata = {
  title: "KiddiCare · Editar Publicación",
  description: "Edición de una publicación de aula para las familias.",
};

const ERROR_CLASSES =
  "rounded-xl border border-error/30 bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container";

const MAIN_CLASSES = `relative ${MAIN_TOP_CLASS} ${SIDEBAR_OFFSET_CLASS} w-full bg-background min-h-screen font-body-md text-body-md`;

type EditarEntradaPageProps = {
  params: Promise<{ id: string }>;
};

type PageShellProps = {
  children: ReactNode;
};

function PageShell({ children }: PageShellProps) {
  return (
    <>
      <AppSidebar activePath="publicaciones" />
      <AppHeader />
      <main className={MAIN_CLASSES}>
        <div className="flex flex-col w-full px-8 pt-6 pb-16 space-y-6">
          {children}
        </div>
      </main>
    </>
  );
}

export default async function EditarEntradaPage({
  params,
}: EditarEntradaPageProps) {
  const profile = await requireStaff();

  const { id } = await params;
  const [{ post, imageUrls, error }, options] = await Promise.all([
    getPostForEdit(id),
    getPostFormOptions(profile),
  ]);

  if (error) {
    return (
      <PageShell>
        <p className={ERROR_CLASSES} role="alert">
          {error}
        </p>
      </PageShell>
    );
  }

  if (!post || !post.canEdit) {
    notFound();
  }

  const initialData: PostFormInitialData = {
    postId: post.id,
    title: post.title,
    body: post.body,
    category: post.category,
    classroomId: post.classroomId,
    images: post.images.map((image) => ({
      id: image.id,
      path: image.path,
      altText: image.altText,
      sortOrder: image.sortOrder,
      url: imageUrls[image.path] ?? null,
    })),
  };

  return (
    <PageShell>
      <header className="flex flex-col gap-1.5">
        <Link
          className="inline-flex min-h-11 items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors self-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-lg"
          href="/panel-aula/entradas"
        >
          <Icon name="chevron_left" size={16} />
          <span>Volver a publicaciones</span>
        </Link>
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
          Editar publicación
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {post.title}
        </p>
      </header>

      <PostForm initialData={initialData} mode="edit" options={options} />
    </PageShell>
  );
}
