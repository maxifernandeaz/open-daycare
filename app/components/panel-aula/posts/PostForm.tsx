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
  updatePost,
} from "@/app/panel-aula/entradas/actions";
import {
  POST_CATEGORY_VALUES,
  getCategoryLabel,
} from "@/app/panel-aula/entradas/formatters";
import type {
  PostFormOptions,
} from "@/app/panel-aula/entradas/queries";
import ImageUploader, {
  type ImageUploaderHandle,
} from "./ImageUploader";
import ConsentNotice from "./ConsentNotice";

const MAX_POST_IMAGES = 4;
const ALT_TEXT_MAX_LENGTH = 160;

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

export type ExistingImage = {
  id: string;
  path: string;
  altText: string | null;
  sortOrder: number;
  url: string | null;
};

export type PostFormInitialData = {
  postId: string;
  title: string;
  body: string;
  category: string | null;
  classroomId: string | null;
  images: ExistingImage[];
};

type PostFormProps = {
  options: PostFormOptions;
  mode?: "create" | "edit";
  initialData?: PostFormInitialData;
};

export default function PostForm({
  options,
  mode = "create",
  initialData,
}: PostFormProps) {
  const router = useRouter();
  const baseId = useId();
  const uploaderRef = useRef<ImageUploaderHandle>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishedPostId, setPublishedPostId] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [keptImages, setKeptImages] = useState<ExistingImage[]>(
    initialData?.images ?? [],
  );
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);

  const isEditing = mode === "edit";

  const titleId = `${baseId}-title`;
  const bodyId = `${baseId}-body`;
  const categoryId = `${baseId}-category`;
  const classroomId = `${baseId}-classroom`;
  const errorId = `${baseId}-error`;
  const warningId = `${baseId}-warning`;

  const hasNoClassrooms = !options.isManager && options.classrooms.length === 0;
  const defaultClassroomId = isEditing
    ? (initialData?.classroomId ?? "")
    : options.isManager
      ? ""
      : (options.classrooms[0]?.id ?? "");
  const [selectedClassroomId, setSelectedClassroomId] =
    useState(defaultClassroomId);
  const isPublished = publishedPostId !== null;
  const isDisabled = isPending || isPublished;

  const maxNewImages = MAX_POST_IMAGES - keptImages.length;

  const handleRemoveExisting = (imageId: string) => {
    setKeptImages((current) => current.filter((img) => img.id !== imageId));
    setRemovedImageIds((current) => [...current, imageId]);
  };

  const handleExistingAltChange = (imageId: string, altText: string) => {
    setKeptImages((current) =>
      current.map((img) =>
        img.id === imageId ? { ...img, altText } : img,
      ),
    );
  };

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

    if (isEditing && initialData) {
      startTransition(async () => {
        const result = await updatePost({
          postId: initialData.postId,
          title,
          body,
          category,
          classroomId: classroomValue.length > 0 ? classroomValue : null,
          removedImageIds,
          keptImages: keptImages.map((img) => ({
            id: img.id,
            altText: img.altText ?? "",
          })),
          newImageTypes: imageTypes,
        });

        if (!result.ok) {
          setError(result.error);
          return;
        }

        let attachedCount = 0;

        if (uploader && result.uploadTargets.length > 0) {
          const uploadResult = await uploader.uploadImages(
            result.uploadTargets,
          );

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
          setWarning(
            result.warning ?? getPartialFailureMessage(missingCount, true),
          );
          return;
        }

        uploader?.clear();
        router.push("/panel-aula/entradas");
      });
    } else {
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
          const uploadResult = await uploader.uploadImages(
            result.uploadTargets,
          );

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
          setWarning(getPartialFailureMessage(missingCount, false));
          return;
        }

        uploader?.clear();
        router.push("/panel-aula/entradas");
      });
    }
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
          {isEditing ? null : (
            <a
              className={LINK_BUTTON_CLASSES}
              href={`/panel-aula/entradas/${publishedPostId}/editar`}
            >
              <Icon name="edit" size={18} />
              <span>Ir a Editar</span>
            </a>
          )}
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
          defaultValue={initialData?.title ?? ""}
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
          defaultValue={initialData?.body ?? ""}
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

      {isEditing && keptImages.length > 0 ? (
        <ExistingImagesSection
          baseId={baseId}
          disabled={isDisabled}
          images={keptImages}
          onAltChange={handleExistingAltChange}
          onRemove={handleRemoveExisting}
        />
      ) : null}

      <ImageUploader
        disabled={isDisabled}
        maxImages={isEditing ? maxNewImages : MAX_POST_IMAGES}
        ref={uploaderRef}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASSES} htmlFor={classroomId}>
            Aula
          </label>
          <select
            className={`${FIELD_CLASSES} cursor-pointer`}
            disabled={isDisabled}
            id={classroomId}
            name="classroom_id"
            onChange={(event) =>
              setSelectedClassroomId(event.currentTarget.value)
            }
            value={selectedClassroomId}
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
            defaultValue={initialData?.category ?? ""}
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

      <ConsentNotice
        classroomId={
          selectedClassroomId.length > 0 ? selectedClassroomId : null
        }
      />

      <div className="flex flex-wrap items-center justify-end gap-3">
        <a className={SECONDARY_BUTTON_CLASSES} href="/panel-aula/entradas">
          {isPublished ? "Volver al listado" : "Cancelar"}
        </a>
        <button
          className={PRIMARY_BUTTON_CLASSES}
          disabled={isDisabled}
          type="submit"
        >
          <Icon name={isEditing ? "save" : "campaign"} size={20} />
          <span>
            {isPending
              ? isEditing
                ? "Guardando…"
                : "Publicando…"
              : isEditing
                ? "Guardar cambios"
                : "Publicar"}
          </span>
        </button>
      </div>
    </form>
  );
}

function getPartialFailureMessage(count: number, isEdit: boolean): string {
  const verb = isEdit ? "actualizó" : "publicó";

  if (count === 1) {
    return `La entrada se ${verb}, pero 1 imagen no se subió. Podés reintentarla desde Editar.`;
  }

  return `La entrada se ${verb}, pero ${count} imágenes no se subieron. Podés reintentarlas desde Editar.`;
}

/* eslint-disable @next/next/no-img-element */

const REMOVE_EXISTING_BUTTON_CLASSES =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-surface-container-lowest px-3 py-2 font-label-sm text-label-sm text-on-surface transition-colors hover:bg-error-container hover:text-on-error-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const EXISTING_FIELD_CLASSES =
  "w-full rounded-xl border border-outline bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-outline shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70";

const IMAGE_PLACEHOLDER_CLASSES =
  "flex h-32 w-full items-center justify-center rounded-lg bg-surface-container text-on-surface-variant";

type ExistingImagesSectionProps = {
  baseId: string;
  disabled: boolean;
  images: ExistingImage[];
  onAltChange: (imageId: string, altText: string) => void;
  onRemove: (imageId: string) => void;
};

function ExistingImagesSection({
  baseId,
  disabled,
  images,
  onAltChange,
  onRemove,
}: ExistingImagesSectionProps) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3 border-0 p-0 m-0">
      <legend className="font-label-md text-label-md text-on-surface mb-1.5">
        Imágenes actuales
      </legend>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {images.map((image, index) => {
          const altInputId = `${baseId}-existing-alt-${image.id}`;
          const altHintId = `${baseId}-existing-alt-hint-${image.id}`;
          const displayAlt =
            image.altText?.trim() ||
            `Imagen existente ${index + 1}`;

          return (
            <li
              className="flex min-w-0 flex-col gap-2 rounded-xl bg-surface-container-low p-3"
              key={image.id}
            >
              {image.url ? (
                <img
                  alt={displayAlt}
                  className="h-32 w-full rounded-lg bg-surface-container object-cover"
                  src={image.url}
                />
              ) : (
                <div className={IMAGE_PLACEHOLDER_CLASSES}>
                  <Icon name="broken_image" size={24} />
                </div>
              )}
              <label
                className="font-label-md text-label-md text-on-surface"
                htmlFor={altInputId}
              >
                Descripción de la imagen {index + 1}{" "}
                <span className="font-normal text-on-surface-variant">
                  (opcional)
                </span>
              </label>
              <input
                aria-describedby={altHintId}
                className={EXISTING_FIELD_CLASSES}
                defaultValue={image.altText ?? ""}
                disabled={disabled}
                id={altInputId}
                maxLength={ALT_TEXT_MAX_LENGTH}
                onChange={(event) =>
                  onAltChange(image.id, event.currentTarget.value)
                }
                placeholder="Ej. Niños jugando en el patio"
                type="text"
              />
              <p
                className="font-body-sm text-body-sm text-on-surface-variant"
                id={altHintId}
              >
                Ayuda a las familias que usan lectores de pantalla.
              </p>
              <button
                aria-label={`Quitar imagen existente ${index + 1}`}
                className={`${REMOVE_EXISTING_BUTTON_CLASSES} self-start`}
                disabled={disabled}
                onClick={() => onRemove(image.id)}
                type="button"
              >
                <Icon name="delete" size={18} />
                <span>Quitar</span>
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
