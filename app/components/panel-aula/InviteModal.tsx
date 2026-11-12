"use client";

import {
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import Icon from "@/app/components/Icons";
import { inviteFamily } from "@/app/panel-aula/actions";

type InviteModalProps = {
  childId: string;
  childName: string;
};

type ModalState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; email: string; code: string }
  | { status: "error"; message: string; canResend: boolean; code: string | null };

type Submission = {
  email: string;
  relationship: string;
};

const TRIGGER_CLASSES =
  "inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-primary-container px-4 py-2.5 font-label-md text-label-md font-bold text-on-primary-container shadow-sm transition-colors hover:bg-primary hover:text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70";

const DIALOG_CLASSES =
  "m-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl border-0 bg-surface-container-lowest p-0 text-on-surface shadow-2xl backdrop:bg-inverse-surface/40 backdrop:backdrop-blur-sm";

const CLOSE_BUTTON_CLASSES =
  "inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const FIELD_CLASSES =
  "w-full rounded-xl bg-surface-container-low px-4 py-3 text-on-surface font-body-md text-body-md placeholder:text-outline focus-visible:bg-surface-container-lowest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const LABEL_CLASSES =
  "font-label-md text-label-md text-on-surface";

const PRIMARY_BUTTON_CLASSES =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-container px-5 py-2.5 font-label-md text-label-md font-bold text-on-primary-container shadow-sm transition-colors hover:bg-primary hover:text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70";

const SECONDARY_BUTTON_CLASSES =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-surface-container px-4 py-2.5 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70";

const ERROR_CLASSES =
  "rounded-xl border border-error/30 bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container";

const SUCCESS_CLASSES =
  "rounded-xl border border-primary/30 bg-primary-fixed px-4 py-3 font-body-sm text-body-sm text-on-primary-fixed";

const CODE_CLASSES =
  "mt-1 block font-label-lg text-label-lg font-bold tracking-[0.25em] text-on-primary-fixed";

const UNEXPECTED_ERROR =
  "No pudimos enviar la invitación. Revisá tu conexión e intentá nuevamente.";

export default function InviteModal({ childId, childName }: InviteModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const lastSubmission = useRef<Submission | null>(null);
  const inFlight = useRef(false);
  const baseId = useId();

  const [state, setState] = useState<ModalState>({ status: "idle" });

  const emailId = `${baseId}-email`;
  const relationshipId = `${baseId}-relationship`;
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;
  const errorId = `${baseId}-error`;

  const openModal = () => {
    setState({ status: "idle" });
    lastSubmission.current = null;
    dialogRef.current?.showModal();
    emailInputRef.current?.focus();
  };

  const closeModal = () => {
    dialogRef.current?.close();
  };

  const handleDialogClose = () => {
    setState({ status: "idle" });
    triggerRef.current?.focus();
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) {
      closeModal();
    }
  };

  const sendInvitation = async ({ email, relationship }: Submission) => {
    if (inFlight.current) {
      return;
    }

    inFlight.current = true;
    lastSubmission.current = { email, relationship };
    setState({ status: "loading" });

    try {
      const result = await inviteFamily(
        childId,
        email,
        relationship ? relationship : undefined,
      );

      if (!result.success) {
        setState({
          status: "error",
          message: result.error,
          canResend: false,
          code: null,
        });
        return;
      }

      if (!result.emailSent) {
        setState({
          status: "error",
          message:
            "La invitación quedó creada, pero no pudimos enviar el correo. Podés reenviarlo ahora.",
          canResend: true,
          code: result.code,
        });
        return;
      }

      setState({ status: "success", email, code: result.code });
    } catch {
      setState({
        status: "error",
        message: UNEXPECTED_ERROR,
        canResend: false,
        code: null,
      });
    } finally {
      inFlight.current = false;
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const relationship = String(formData.get("relationship") ?? "").trim();

    void sendInvitation({ email, relationship });
  };

  const handleResend = () => {
    const submission = lastSubmission.current;

    if (submission) {
      void sendInvitation(submission);
    }
  };

  const isLoading = state.status === "loading";

  return (
    <>
      <button
        className={TRIGGER_CLASSES}
        onClick={openModal}
        ref={triggerRef}
        type="button"
      >
        <Icon name="person_add" size={18} />
        Invitar familia
      </button>

      <dialog
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className={DIALOG_CLASSES}
        onCancel={closeModal}
        onClick={handleBackdropClick}
        onClose={handleDialogClose}
        ref={dialogRef}
      >
        <div className="flex max-h-[85vh] flex-col gap-5 overflow-y-auto p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container/20 text-on-primary-container">
                <Icon name="forward_to_inbox" size={26} />
              </div>
              <div>
                <h2
                  className="font-headline-sm text-headline-sm text-on-surface"
                  id={titleId}
                >
                  Invitar familia
                </h2>
                <p
                  className="font-body-sm text-body-sm text-on-surface-variant"
                  id={descriptionId}
                >
                  Enviaremos un correo con un código para seguir a {childName}.
                </p>
              </div>
            </div>
            <button
              aria-label="Cerrar modal de invitación"
              className={CLOSE_BUTTON_CLASSES}
              onClick={closeModal}
              type="button"
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          {state.status === "success" ? (
            <div className={SUCCESS_CLASSES} role="status">
              <p>
                Invitación enviada a <strong>{state.email}</strong>.
              </p>
              <span className={CODE_CLASSES}>{state.code.split("").join(" ")}</span>
              <p className="mt-2">
                Compartí este código solo si la familia no recibe el correo.
              </p>
            </div>
          ) : null}

          {state.status === "error" ? (
            <div className={ERROR_CLASSES} id={errorId} role="alert">
              <p>{state.message}</p>
              {state.code ? (
                <span className="mt-1 block font-label-lg text-label-lg font-bold tracking-[0.25em]">
                  {state.code.split("").join(" ")}
                </span>
              ) : null}
            </div>
          ) : null}

          {state.status === "success" ? (
            <div className="flex justify-end">
              <button
                className={PRIMARY_BUTTON_CLASSES}
                onClick={closeModal}
                type="button"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <form
              aria-busy={isLoading}
              className="flex flex-col gap-4"
              onSubmit={handleSubmit}
            >
              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLASSES} htmlFor={emailId}>
                  Email de la familia
                </label>
                <input
                  aria-describedby={
                    state.status === "error" ? errorId : undefined
                  }
                  aria-required="true"
                  autoComplete="email"
                  className={FIELD_CLASSES}
                  disabled={isLoading}
                  id={emailId}
                  name="email"
                  placeholder="familia@ejemplo.com"
                  ref={emailInputRef}
                  required
                  type="email"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLASSES} htmlFor={relationshipId}>
                  Parentesco{" "}
                  <span className="font-normal text-on-surface-variant">
                    (opcional)
                  </span>
                </label>
                <input
                  autoComplete="off"
                  className={FIELD_CLASSES}
                  disabled={isLoading}
                  id={relationshipId}
                  name="relationship"
                  placeholder="Ej. Madre, padre, abuela"
                  type="text"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                <button
                  className={SECONDARY_BUTTON_CLASSES}
                  disabled={isLoading}
                  onClick={closeModal}
                  type="button"
                >
                  Cancelar
                </button>

                {state.status === "error" && state.canResend ? (
                  <button
                    className={PRIMARY_BUTTON_CLASSES}
                    disabled={isLoading}
                    onClick={handleResend}
                    type="button"
                  >
                    {isLoading ? "Reenviando…" : "Reenviar"}
                  </button>
                ) : (
                  <button
                    className={PRIMARY_BUTTON_CLASSES}
                    disabled={isLoading}
                    type="submit"
                  >
                    {isLoading ? "Enviando…" : "Invitar"}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
