"use client";

import { useActionState } from "react";
import AuthField from "@/app/components/auth/AuthField";
import { login, type LoginState } from "@/app/login/actions";
import type { LoginScreen } from "@/data/mock-auth";

const INITIAL_STATE: LoginState = {};

const ERROR_CLASSES =
  "rounded-xl border border-error/30 bg-error-container px-4 py-3 text-body-sm text-on-error-container";

const FORGOT_LINK_CLASSES =
  "text-body-sm font-semibold text-primary hover:underline";

const SUBMIT_CLASSES =
  "w-full rounded-xl bg-primary-container px-6 py-3.5 text-on-primary font-label-lg text-label-lg shadow-[0_4px_14px_rgba(16,185,129,0.25)] transition-all hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-primary-container disabled:active:scale-100";

type LoginFormProps = {
  form: LoginScreen["form"];
};

export default function LoginForm({ form }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(login, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <p className={ERROR_CLASSES} role="alert">
          {state.error}
        </p>
      ) : null}

      {form.fields.map((field) => (
        <AuthField
          field={
            field.id === "email" && state.email
              ? { ...field, defaultValue: state.email }
              : field
          }
          key={field.id}
        />
      ))}

      <div className="flex justify-end pt-0.5">
        <a className={FORGOT_LINK_CLASSES} href="#">
          {form.forgotLabel}
        </a>
      </div>

      <div className="pt-3">
        <button className={SUBMIT_CLASSES} disabled={isPending} type="submit">
          {form.submitLabel}
        </button>
      </div>
    </form>
  );
}
