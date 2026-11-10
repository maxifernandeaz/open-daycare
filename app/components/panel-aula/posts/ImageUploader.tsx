/* eslint-disable @next/next/no-img-element */

"use client";

import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type Ref,
} from "react";
import Icon from "@/app/components/Icons";
import type {
  PostImageMime,
  UploadTarget,
} from "@/app/panel-aula/entradas/actions";
import { createClient } from "@/utils/supabase/client";

const MAX_IMAGES = 4;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALT_TEXT_MAX_LENGTH = 160;
const POST_IMAGES_BUCKET = "post-images";
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const satisfies readonly PostImageMime[];
const ACCEPTED_FILE_TYPES = ALLOWED_MIME_TYPES.join(",");

const IMAGES_LIMIT_ERROR = "Podés adjuntar hasta 4 imágenes.";
const FILE_TYPE_ERROR = "Solo se permiten imágenes JPG, PNG o WebP.";
const FILE_SIZE_ERROR = "Cada imagen debe pesar 5 MB o menos.";

const FIELD_CLASSES =
  "w-full rounded-xl bg-surface-container-low px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-outline shadow-sm transition-colors focus:bg-surface-container-lowest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70";

const LABEL_CLASSES = "font-label-md text-label-md text-on-surface";

const HINT_CLASSES = "font-body-sm text-body-sm text-on-surface-variant";

const ERROR_CLASSES =
  "rounded-xl border border-error/30 bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container";

const ADD_BUTTON_CLASSES =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-surface-container px-4 py-2.5 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70";

const REMOVE_BUTTON_CLASSES =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-surface-container-lowest px-3 py-2 font-label-sm text-label-sm text-on-surface transition-colors hover:bg-error-container hover:text-on-error-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export type UploadedImage = {
  path: string;
  altText: string;
};

export type ImageUploadResult = {
  uploaded: UploadedImage[];
  failed: number;
};

export type ImageUploaderHandle = {
  getImageTypes: () => PostImageMime[];
  getImageCount: () => number;
  uploadImages: (targets: UploadTarget[]) => Promise<ImageUploadResult>;
  clear: () => void;
};

type DraftImage = {
  id: string;
  file: File;
  previewUrl: string;
  altText: string;
};

type ImageUploaderProps = {
  ref?: Ref<ImageUploaderHandle>;
  disabled?: boolean;
};

export default function ImageUploader({
  ref,
  disabled = false,
}: ImageUploaderProps) {
  const baseId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<DraftImage[]>([]);
  const [images, setImages] = useState<DraftImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const hintId = `${baseId}-hint`;
  const errorId = `${baseId}-error`;

  const isDisabled = disabled || isUploading;
  const canAddMore = images.length < MAX_IMAGES;

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      for (const image of imagesRef.current) {
        URL.revokeObjectURL(image.previewUrl);
      }
    };
  }, []);

  const openPicker = () => {
    inputRef.current?.click();
  };

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    input.value = "";

    if (files.length === 0) {
      return;
    }

    const selected: DraftImage[] = [];
    let nextError: string | null = null;

    for (const file of files) {
      if (images.length + selected.length >= MAX_IMAGES) {
        nextError = IMAGES_LIMIT_ERROR;
        break;
      }

      if (!isAllowedMime(file.type)) {
        nextError = FILE_TYPE_ERROR;
        continue;
      }

      if (file.size > MAX_FILE_BYTES) {
        nextError = FILE_SIZE_ERROR;
        continue;
      }

      selected.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        altText: "",
      });
    }

    if (selected.length > 0) {
      setImages((current) => [...current, ...selected]);
    }

    setError(nextError);
  };

  const handleRemove = (id: string) => {
    const target = images.find((image) => image.id === id);

    if (target) {
      URL.revokeObjectURL(target.previewUrl);
    }

    setImages((current) => current.filter((image) => image.id !== id));
    setError(null);
  };

  const handleAltTextChange = (id: string, altText: string) => {
    setImages((current) =>
      current.map((image) =>
        image.id === id ? { ...image, altText } : image,
      ),
    );
  };

  useImperativeHandle(ref, () => ({
    getImageTypes: () => {
      const imageTypes: PostImageMime[] = [];

      for (const image of images) {
        if (isAllowedMime(image.file.type)) {
          imageTypes.push(image.file.type);
        }
      }

      return imageTypes;
    },
    getImageCount: () => images.length,
    uploadImages: async (targets: UploadTarget[]): Promise<ImageUploadResult> => {
      setIsUploading(true);

      try {
        const supabase = createClient();
        const results = await Promise.allSettled(
          images.map(
            async (image, index): Promise<UploadedImage | null> => {
              const target = targets[index];

              if (!target) {
                return null;
              }

              const { error: uploadError } = await supabase.storage
                .from(POST_IMAGES_BUCKET)
                .uploadToSignedUrl(target.path, target.token, image.file, {
                  contentType: image.file.type,
                });

              if (uploadError) {
                return null;
              }

              return {
                path: target.path,
                altText: image.altText.trim(),
              };
            },
          ),
        );

        const uploaded: UploadedImage[] = [];

        for (const result of results) {
          if (result.status === "fulfilled" && result.value) {
            uploaded.push(result.value);
          }
        }

        return { uploaded, failed: images.length - uploaded.length };
      } finally {
        setIsUploading(false);
      }
    },
    clear: () => {
      for (const image of images) {
        URL.revokeObjectURL(image.previewUrl);
      }

      setImages([]);
      setError(null);
    },
  }));

  return (
    <fieldset className="flex min-w-0 flex-col gap-3 border-0 p-0 m-0">
      <legend className={`${LABEL_CLASSES} mb-1.5`}>
        Imágenes{" "}
        <span className="font-normal text-on-surface-variant">(opcional)</span>
      </legend>

      <p className={HINT_CLASSES} id={hintId}>
        Hasta 4 imágenes JPG, PNG o WebP de 5 MB como máximo.
      </p>

      {error ? (
        <p className={ERROR_CLASSES} id={errorId} role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <input
          accept={ACCEPTED_FILE_TYPES}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          aria-label="Seleccionar imágenes"
          className="sr-only"
          disabled={isDisabled || !canAddMore}
          id={`${baseId}-input`}
          multiple
          onChange={handleFilesSelected}
          ref={inputRef}
          type="file"
        />
        <button
          aria-describedby={hintId}
          className={ADD_BUTTON_CLASSES}
          disabled={isDisabled || !canAddMore}
          onClick={openPicker}
          type="button"
        >
          <Icon name="add_photo_alternate" size={20} />
          <span>Añadir imágenes</span>
        </button>
        <span className={HINT_CLASSES} aria-live="polite">
          {images.length} de {MAX_IMAGES}
        </span>
        {isUploading ? (
          <span className={HINT_CLASSES} aria-live="polite">
            Subiendo imágenes…
          </span>
        ) : null}
      </div>

      {images.length > 0 ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {images.map((image, index) => {
            const altInputId = `${baseId}-alt-${image.id}`;
            const altHintId = `${baseId}-alt-hint-${image.id}`;
            const previewAlt =
              image.altText.trim() || `Vista previa de la imagen ${index + 1}`;

            return (
              <li
                className="flex min-w-0 flex-col gap-2 rounded-xl bg-surface-container-low p-3"
                key={image.id}
              >
                <img
                  alt={previewAlt}
                  className="h-32 w-full rounded-lg bg-surface-container object-cover"
                  src={image.previewUrl}
                />
                <label className={LABEL_CLASSES} htmlFor={altInputId}>
                  Descripción de la imagen {index + 1}{" "}
                  <span className="font-normal text-on-surface-variant">
                    (opcional)
                  </span>
                </label>
                <input
                  aria-describedby={altHintId}
                  className={FIELD_CLASSES}
                  disabled={isDisabled}
                  id={altInputId}
                  maxLength={ALT_TEXT_MAX_LENGTH}
                  onChange={(event) =>
                    handleAltTextChange(image.id, event.currentTarget.value)
                  }
                  placeholder="Ej. Niños jugando en el patio"
                  type="text"
                  value={image.altText}
                />
                <p className={HINT_CLASSES} id={altHintId}>
                  Ayuda a las familias que usan lectores de pantalla.
                </p>
                <button
                  aria-label={`Quitar imagen ${index + 1}`}
                  className={`${REMOVE_BUTTON_CLASSES} self-start`}
                  disabled={isDisabled}
                  onClick={() => handleRemove(image.id)}
                  type="button"
                >
                  <Icon name="delete" size={18} />
                  <span>Quitar</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </fieldset>
  );
}

function isAllowedMime(value: string): value is PostImageMime {
  return ALLOWED_MIME_TYPES.some((mime) => mime === value);
}
