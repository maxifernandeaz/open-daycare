import type { Metadata } from "next";
import AuthField from "@/app/components/auth/AuthField";
import LoginBrandPanel from "@/app/components/auth/LoginBrandPanel";
import { loginScreen } from "@/data/mock-auth";

export const metadata: Metadata = {
  title: "KiddiCare · Iniciar sesión",
  description:
    "Ingresá al portal de KiddiCare para ver el día de hoy de tu hijo en el Centro Infantil Sol.",
};

const CARD_CLASSES =
  "relative flex min-h-[660px] w-full max-w-[1080px] flex-col overflow-hidden rounded-[28px] border border-white/20 bg-background shadow-sm md:flex-row";

const FORM_PANEL_CLASSES =
  "relative flex w-full flex-col justify-center bg-background p-8 md:w-[52%] md:p-14 lg:p-16";

const FORM_CONTENT_CLASSES = "mx-auto w-full max-w-[390px]";
const FORM_HEADER_CLASSES = "mb-8";
const TITLE_CLASSES =
  "font-headline-lg text-headline-lg tracking-tight text-on-surface";
const SUBTITLE_CLASSES = "mt-2 text-body-md text-on-surface-variant";
const FORGOT_LINK_CLASSES =
  "text-body-sm font-semibold text-primary hover:underline";
const SUBMIT_CLASSES =
  "w-full rounded-xl bg-primary-container px-6 py-3.5 text-on-primary font-label-lg text-label-lg shadow-[0_4px_14px_rgba(16,185,129,0.25)] transition-all hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[0.99]";
const INVITE_PREFIX_CLASSES = "mt-8 text-center text-body-sm text-on-surface-variant";
const INVITE_LINK_CLASSES = "ml-1 font-bold text-primary hover:underline";

export default function LoginPage() {
  const { form, footer } = loginScreen;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-3 font-sans md:p-6">
      <main className={CARD_CLASSES}>
        <LoginBrandPanel />

        <section className={FORM_PANEL_CLASSES}>
          <div className={FORM_CONTENT_CLASSES}>
            <header className={FORM_HEADER_CLASSES}>
              <h2 className={TITLE_CLASSES}>{form.title}</h2>
              <p className={SUBTITLE_CLASSES}>{form.subtitle}</p>
            </header>

            <form className="space-y-5">
              {form.fields.map((field) => (
                <AuthField field={field} key={field.id} />
              ))}

              <div className="flex justify-end pt-0.5">
                <a className={FORGOT_LINK_CLASSES} href="#">
                  {form.forgotLabel}
                </a>
              </div>

              <div className="pt-3">
                <button className={SUBMIT_CLASSES} type="button">
                  {form.submitLabel}
                </button>
              </div>
            </form>

            <p className={INVITE_PREFIX_CLASSES}>
              {footer.prefix}
              {" "}
              <a className={INVITE_LINK_CLASSES} href={footer.linkHref}>
                {footer.linkLabel}
              </a>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
