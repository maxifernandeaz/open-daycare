import type { Metadata } from "next";
import AuthField from "@/app/components/auth/AuthField";
import BrandLockup from "@/app/components/auth/BrandLockup";
import Icon from "@/app/components/Icons";
import { activationScreen } from "@/data/mock-auth";

export const metadata: Metadata = {
  title: "KiddiCare · Activar cuenta",
  description:
    "Activá tu cuenta de KiddiCare para seguir el día de tu hijo en el Centro Infantil Sol.",
};

const PAGE_CLASSES =
  "flex min-h-screen items-center justify-center bg-background p-4 font-sans sm:p-6 lg:p-10";
const MAIN_CLASSES =
  "mx-auto flex w-full max-w-[540px] flex-col items-start py-6 sm:py-10";
const HEADER_CLASSES = "mb-7 w-full";
const TITLE_CLASSES =
  "font-headline-lg text-headline-lg tracking-tight text-on-surface";
const SUBTITLE_CLASSES =
  "mt-2 text-body-md leading-relaxed text-on-surface-variant sm:text-body-lg";
const CHILD_CARD_CLASSES =
  "mb-7 flex w-full items-center gap-4 rounded-2xl border border-black/[0.04] bg-surface-container-lowest p-4 shadow-sm sm:p-5";
const CHILD_AVATAR_CLASSES =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-fixed font-headline-sm text-headline-sm font-semibold text-on-secondary-fixed";
const CHILD_LABEL_CLASSES =
  "mb-1 text-body-sm leading-tight text-on-surface-variant";
const CHILD_NAME_CLASSES = "font-headline-sm text-headline-sm text-on-surface";
const FORM_CLASSES = "w-full space-y-5";
const CONSENT_BANNER_CLASSES =
  "flex w-full items-start gap-3 rounded-xl border border-tertiary-fixed bg-tertiary-fixed/30 p-3.5 sm:items-center sm:p-4";
const CONSENT_CONTROL_CLASSES =
  "relative flex shrink-0 cursor-pointer select-none items-center";
const CONSENT_BOX_CLASSES =
  "flex h-6 w-6 items-center justify-center rounded-md bg-primary-container text-on-primary transition-all peer-focus:ring-2 peer-focus:ring-primary/30";
const CONSENT_TEXT_CLASSES =
  "cursor-pointer select-none text-body-md leading-snug text-on-surface-variant";
const SUBMIT_CLASSES =
  "w-full rounded-2xl bg-primary-container px-6 py-4 font-label-lg text-label-lg text-on-primary shadow-[0_4px_14px_rgba(16,185,129,0.25)] transition-all duration-200 ease-in-out hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[0.99]";

const CONSENT_INPUT_ID = "photo-consent";

export default function ActivarCuentaPage() {
  const { brand, child, consent, fields, header, submitLabel } = activationScreen;

  return (
    <div className={PAGE_CLASSES}>
      <main className={MAIN_CLASSES}>
        <header className={HEADER_CLASSES}>
          <BrandLockup brand={brand} className="mb-6" variant="light" />

          <h1 className={TITLE_CLASSES}>{header.title}</h1>
          <p className={SUBTITLE_CLASSES}>{header.body}</p>
        </header>

        <section className={CHILD_CARD_CLASSES}>
          <div className={CHILD_AVATAR_CLASSES}>{child.initial}</div>

          <div className="flex flex-col">
            <span className={CHILD_LABEL_CLASSES}>{child.invitationLabel}</span>
            <span className={CHILD_NAME_CLASSES}>
              {child.name} · {child.classroom}
            </span>
          </div>
        </section>

        <form className={FORM_CLASSES}>
          {fields.map((field) => (
            <AuthField field={field} key={field.id} />
          ))}

          <div className={CONSENT_BANNER_CLASSES}>
            <label className={CONSENT_CONTROL_CLASSES} htmlFor={CONSENT_INPUT_ID}>
              <input
                className="peer sr-only"
                defaultChecked
                id={CONSENT_INPUT_ID}
                name="photoConsent"
                type="checkbox"
              />
              <span className={CONSENT_BOX_CLASSES}>
                <Icon name="check" size={16} />
              </span>
            </label>

            <label className={CONSENT_TEXT_CLASSES} htmlFor={CONSENT_INPUT_ID}>
              {consent.label}
            </label>
          </div>

          <div className="pt-2">
            <button className={SUBMIT_CLASSES} type="button">
              {submitLabel}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
