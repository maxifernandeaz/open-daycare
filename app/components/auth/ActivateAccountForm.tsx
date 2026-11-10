"use client";

import { useActionState } from "react";
import AuthField from "@/app/components/auth/AuthField";
import Icon from "@/app/components/Icons";
import {
  activateAccount,
  type ActivateAccountState,
} from "@/app/activar-cuenta/actions";
import type { AuthFieldData } from "@/data/mock-auth";

const INITIAL_STATE: ActivateAccountState = {};
const CONSENT_INPUT_ID = "photo-consent";
const NOTICE_ID = "activation-notice";
const ERROR_ID = "activation-error";

const FORM_CLASSES = "w-full space-y-5";
const ERROR_CLASSES =
  "rounded-xl border border-error/30 bg-error-container px-4 py-3 text-body-sm text-on-error-container";
const CONSENT_BANNER_CLASSES =
  "flex w-full items-start gap-3 rounded-xl border border-tertiary-fixed bg-tertiary-fixed/30 p-3.5 sm:items-center sm:p-4";
const CONSENT_CONTROL_CLASSES =
  "relative flex w-full cursor-pointer select-none items-start gap-3 sm:items-center";
const CONSENT_BOX_CLASSES =
  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-outline bg-surface-container-lowest text-transparent transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2 peer-focus:ring-offset-background";
const CONSENT_TEXT_CLASSES =
  "cursor-pointer select-none text-body-md leading-snug text-on-surface-variant";
const SUBMIT_CLASSES =
  "w-full rounded-2xl bg-primary px-6 py-4 font-label-lg text-label-lg text-on-primary shadow-[0_4px_14px_rgba(16,185,129,0.25)] transition-all duration-200 ease-in-out hover:bg-on-primary-container focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-primary disabled:active:scale-100";

type ActivateAccountFormProps = {
  fields: AuthFieldData[];
  consentLabel: string;
  submitLabel: string;
  notice?: string;
};

export default function ActivateAccountForm({
  fields,
  consentLabel,
  submitLabel,
  notice,
}: ActivateAccountFormProps) {
  const [state, formAction, isPending] = useActionState<
    ActivateAccountState,
    FormData
  >(activateAccount, INITIAL_STATE);

  const errorId = state.error ? ERROR_ID : undefined;

  return (
    <form action={formAction} aria-busy={isPending} className={FORM_CLASSES}>
      {notice ? (
        <p className={ERROR_CLASSES} id={NOTICE_ID} role="status">
          {notice}
        </p>
      ) : null}

      {state.error ? (
        <p className={ERROR_CLASSES} id={ERROR_ID} role="alert">
          {state.error}
        </p>
      ) : null}

      {fields.map((field) => (
        <AuthField errorId={errorId} field={field} key={field.id} />
      ))}

      <div className={CONSENT_BANNER_CLASSES}>
        <label className={CONSENT_CONTROL_CLASSES} htmlFor={CONSENT_INPUT_ID}>
          <input
            className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
            defaultChecked
            id={CONSENT_INPUT_ID}
            name="photoConsent"
            type="checkbox"
          />
          <span aria-hidden="true" className={CONSENT_BOX_CLASSES}>
            <Icon name="check" size={16} />
          </span>
          <span className={CONSENT_TEXT_CLASSES}>{consentLabel}</span>
        </label>
      </div>

      <div className="pt-2">
        <button
          aria-busy={isPending}
          className={SUBMIT_CLASSES}
          disabled={isPending}
          type="submit"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
