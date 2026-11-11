"use client";

import { useId, useRef, useState, useTransition } from "react";
import Icon from "@/app/components/Icons";
import { deletePost } from "@/app/panel-aula/entradas/actions";

const TRIGGER_BUTTON_CLASSES =
  "inline-flex min-h-11 items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-low hover:bg-error-container text-on-surface hover:text-on-error-container font-label-md text-label-md transition-colors active:scale-95 disabled:cursor-not-allowed disabled:opacity-70";

const CANCEL_BUTTON_CLASSES =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-surface-container px-4 py-2.5 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70";

const CONFIRM_BUTTON_CLASSES =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-error px-4 py-2.5 font-label-md text-label-md text-on-error shadow-sm transition-all hover:bg-error/90 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error disabled:cursor-not-allowed disabled:opacity-70";

const ERROR_MESSAGE_CLASSES =
  "rounded-xl border border-error/30 bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container";

const WARNING_MESSAGE_CLASSES =
  "rounded-xl border border-tertiary/40 bg-tertiary-fixed px-4 py-3 font-body-sm text-body-sm text-on-tertiary-fixed";

type DeletePostButtonProps = {
  postId: string;
  postTitle: string;
};

export default function DeletePostButton({
  postId,
  postTitle,
}: DeletePostButtonProps) {
  const dialogId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const titleId = `${dialogId}-title`;
  const descId = `${dialogId}-desc`;

  const handleOpen = () => {
    setError(null);
    setWarning(null);
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    }
    // Return focus to the trigger button upon cancelling/closing
    triggerRef.current?.focus();
  };

  const handleConfirm = () => {
    setError(null);
    setWarning(null);

    startTransition(async () => {
      const result = await deletePost(postId);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.storageCleanupFailed) {
        setWarning(
          "La publicación fue eliminada, pero algunas imágenes no se pudieron borrar del almacenamiento.",
        );
      }

      dialogRef.current?.close();
      triggerRef.current?.focus();
    });
  };

  return (
    <>
      <button
        aria-label={`Eliminar publicación "${postTitle}"`}
        className={TRIGGER_BUTTON_CLASSES}
        disabled={isPending}
        onClick={handleOpen}
        ref={triggerRef}
        type="button"
      >
        <Icon name="delete" size={18} />
        <span>Eliminar</span>
      </button>

      {warning ? (
        <div
          aria-live="polite"
          className={`mt-2 ${WARNING_MESSAGE_CLASSES}`}
          role="status"
        >
          <div className="flex items-center gap-2">
            <Icon className="shrink-0 text-tertiary" name="warning" size={18} />
            <span>{warning}</span>
          </div>
        </div>
      ) : null}

      <dialog
        aria-describedby={descId}
        aria-labelledby={titleId}
        className="fixed inset-0 m-auto max-w-md w-[calc(100%-2rem)] rounded-2xl bg-surface-container-lowest p-6 text-on-surface shadow-xl backdrop:bg-black/50 backdrop:backdrop-blur-xs open:flex open:flex-col open:gap-5"
        onCancel={(e) => {
          // Native dialog cancel triggered by Escape key
          e.preventDefault();
          handleClose();
        }}
        ref={dialogRef}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-container text-on-error-container">
            <Icon name="delete" size={20} />
          </div>
          <h2 className="font-title-md text-title-md text-on-surface" id={titleId}>
            ¿Eliminar publicación?
          </h2>
        </div>

        <p className="font-body-md text-body-md text-on-surface-variant" id={descId}>
          Esta acción no se puede deshacer. Se eliminará la publicación{" "}
          <strong className="font-semibold text-on-surface">"{postTitle}"</strong>{" "}
          junto con sus imágenes asociadas.
        </p>

        {error ? (
          <p className={ERROR_MESSAGE_CLASSES} role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            className={CANCEL_BUTTON_CLASSES}
            disabled={isPending}
            onClick={handleClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className={CONFIRM_BUTTON_CLASSES}
            disabled={isPending}
            onClick={handleConfirm}
            type="button"
          >
            {isPending ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </div>
      </dialog>
    </>
  );
}
