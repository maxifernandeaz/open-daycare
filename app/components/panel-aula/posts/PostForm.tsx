"use client";

import {
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import Icon from "@/app/components/Icons";
import {
  attachPostImages,
  createPost,
} from "@/app/panel-aula/entradas/actions";
import {
  POST_CATEGORY_VALUES,
  getCategoryLabel,
} from "@/app/panel-aula/entradas/formatters";
import type { PostFormOptions } from "@/app/panel-aula/entradas/queries";
import ImageUploader, {
  type ImageUploaderHandle,
} from "./ImageUploader";

const FIELD_CLASSES =
  "w-full rounded-xl bg-surface-container-low px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-outline shadow-sm transition-colors focus:bg-surface-container-lowest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70";

const LABEL_CLASSES = "font-label-md text-label-md text-on-surface";

const HINT_CLASSES = "font-body-sm text-body-sm text-on-surface-variant";

const ERROR_CLASSES =
  "rounded-xl border border-error/30 bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container";

const NOTICE_CLASSES =
  "rounded-xl bg-surface-container-low px-4 py-3 font-body-sm text-body-sm text-on-surface-variant";

const WARNING_CLASSES =
  "flex flex-col gap-3 rounded-xl border border-tertiary/40 bg-tertiary-fixed px-4 py-3 font-body-sm text-body-sm text-on-tertiary-fixed";

const LINK_BUTTON_CLASSES =
  "inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-surface-container-lowest px-4 py-2.5 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const PRIMARY_BUTTON_CLASSES =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-lg text-label-lg text-on-primary shadow-md transition-all hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70";

const SECONDARY_BUTTON_CLASSES =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-surface-container px-4 py-2.5 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70";

type PostFormProps = {
  options: PostFormOptions;
};

export default function PostForm({ options }: PostFormProps) {
  const router = useRouter();
  const baseId = useId();
  const uploaderRef = useRef<ImageUploaderHandle>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishedPostId, setPublishedPostId] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const titleId = `${baseId}-title`;
  const bodyId = `${baseId}-body`;
  const categoryId = `${baseId}-category`;
  const classroomId = `${baseId}-classroom`;
  const errorId = `${baseId}-error`;
  const warningId = `${baseId}-warning`;

  const hasNoClassrooms = !options.isManager && options.classrooms.length === 0;
  const defaultClassroomId = options.isManager
    ? ""
    : (options.classrooms[0]?.id ?? "");
  const isPublished = publishedPostId !== null;
  const isDisabled = isPending || isPublished;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "");
    const body = String(formData.get("body") ?? "");
    const categoryValue = String(formData.get("category") ?? "");
    const classroomValue = String(formData.get("classroom_id") ?? "");
    const category =
      POST_CATEGORY_VALUES.find((value) => value === categoryValue) ?? null;
    const uploader = uploaderRef.current;
    const imageTypes = uploader?.getImageTypes() ?? [];

    setError(null);
    setWarning(null);

    startTransition(async () => {
      const result = await createPost({
        title,
        body,
        category,
        classroomId: classroomValue.length > 0 ? classroomValue : null,
        imageTypes,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      let attachedCount = 0;

      if (uploader && result.uploadTargets.length > 0) {
        const uploadResult = await uploader.uploadImages(result.uploadTargets);

        if (uploadResult.uploaded.length > 0) {
          const attachResult = await attachPostImages({
            postId: result.postId,
            images: uploadResult.uploaded,
          });

          if (attachResult.ok) {
            attachedCount = attachResult.attached;
          }
        }
      }

      const missingCount = imageTypes.length - attachedCount;

      if (missingCount > 0 || result.warning) {
        uploader?.clear();
        setPublishedPostId(result.postId);
        setWarning(getPartialFailureMessage(missingCount));
        return;
      }

      uploader?.clear();
      router.push("/panel-aula/entradas");
    });
  };

  if (options.error) {
    return (
      <p className={ERROR_CLASSES} role="alert">
        {options.error}
      </p>
    );
  }

  if (hasNoClassrooms) {
    return (
      <div className={NOTICE_CLASSES} role="status">
        <p className="font-label-md text-label-md text-on-surface">
          No tenés aulas asignadas.
        </p>
        <p className="mt-1">
          Pedile a un administrador que te asigne un aula para poder publicar
          entradas para las familias.
        </p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-6 shadow-sm"
      onSubmit={handleSubmit}
    >
      {error ? (
        <p className={ERROR_CLASSES} id={errorId} role="alert">
          {error}
        </p>
      ) : null}

      {warning && publishedPostId ? (
        <div
          aria-live="polite"
          className={WARNING_CLASSES}
          id={warningId}
          role="status"
        >
          <p className="flex items-start gap-2">
            <Icon className="shrink-0 text-tertiary" name="warning" size={20} />
            <span>{warning}</span>
          </p>
          <a
            className={LINK_BUTTON_CLASSES}
            href={`/panel-aula/entradas/${publishedPostId}/editar`}
          >
            <Icon name="edit" size={18} />
            <span>Ir a Editar</span>
          </a>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLASSES} htmlFor={titleId}>
          Título
        </label>
        <input
          aria-describedby={error ? errorId : undefined}
          aria-required="true"
          className={FIELD_CLASSES}
          disabled={isDisabled}
          id={titleId}
          maxLength={120}
          name="title"
          placeholder="Ej. Excursión al parque"
          required
          type="text"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLASSES} htmlFor={bodyId}>
          Contenido
        </label>
        <textarea
          aria-describedby={error ? errorId : undefined}
          aria-required="true"
          className={`${FIELD_CLASSES} min-h-40 resize-y`}
          disabled={isDisabled}
          id={bodyId}
          maxLength={5000}
          name="body"
          placeholder="Contales a las familias qué pasó en el aula…"
          required
          rows={8}
        />
        <p className={HINT_CLASSES}>
          Texto plano. Los saltos de línea se respetan tal como los escribís.
        </p>
      </div>

      <ImageUploader disabled={isDisabled} ref={uploaderRef} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASSES} htmlFor={classroomId}>
            Aula
          </label>
          <select
            className={`${FIELD_CLASSES} cursor-pointer`}
            defaultValue={defaultClassroomId}
            disabled={isDisabled}
            id={classroomId}
            name="classroom_id"
          >
            {options.isManager ? (
              <option value="">Todas las aulas</option>
            ) : null}
            {options.classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASSES} htmlFor={categoryId}>
            Categoría{" "}
            <span className="font-normal text-on-surface-variant">
              (opcional)
            </span>
          </label>
          <select
            className={`${FIELD_CLASSES} cursor-pointer`}
            defaultValue=""
            disabled={isDisabled}
            id={categoryId}
            name="category"
          >
            <option value="">Sin categoría</option>
            {POST_CATEGORY_VALUES.map((value) => (
              <option key={value} value={value}>
                {getCategoryLabel(value)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <a className={SECONDARY_BUTTON_CLASSES} href="/panel-aula/entradas">
          {isPublished ? "Volver al listado" : "Cancelar"}
        </a>
        <button
          className={PRIMARY_BUTTON_CLASSES}
          disabled={isDisabled}
          type="submit"
        >
          <Icon name="campaign" size={20} />
          <span>{isPending ? "Publicando…" : "Publicar"}</span>
        </button>
      </div>
    </form>
  );
}

function getPartialFailureMessage(count: number): string {
  if (count === 1) {
    return "La entrada se publicó, pero 1 imagen no se subió. Podés reintentarla desde Editar.";
  }

  return `La entrada se publicó, pero ${count} imágenes no se subieron. Podés reintentarlas desde Editar.`;
}
