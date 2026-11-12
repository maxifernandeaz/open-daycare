import type { Metadata } from "next";
import { cookies } from "next/headers";
import ActivateAccountForm from "@/app/components/auth/ActivateAccountForm";
import BrandLockup from "@/app/components/auth/BrandLockup";
import { activationScreen, type AuthFieldData } from "@/data/mock-auth";
import type { Database } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

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

const INVALID_INVITATION_MESSAGE =
  "Esta invitación no es válida o ya venció.";

type InvitationPreview =
  Database["public"]["Functions"]["get_invitation_preview"]["Returns"][number];

type ActivarCuentaPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeCode(value: string | undefined): string {
  return value?.replace(/\s+/g, "").toUpperCase() ?? "";
}

async function getInvitationPreview(
  code: string,
): Promise<InvitationPreview | null> {
  if (!code) {
    return null;
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.rpc("get_invitation_preview", {
    p_code: code,
  });

  if (error) {
    return null;
  }

  return data?.[0] ?? null;
}

export default async function ActivarCuentaPage({
  searchParams,
}: ActivarCuentaPageProps) {
  const params = await searchParams;
  const normalizedCode = normalizeCode(firstParam(params.code));
  const preview = await getInvitationPreview(normalizedCode);

  const { brand, child, fields, consent, header, submitLabel } =
    activationScreen;
  const hasPreview = preview !== null;

  const formFields: AuthFieldData[] = fields.map((field) => {
    if (field.name === "inviteCode") {
      return {
        ...field,
        defaultValue: normalizedCode ? normalizedCode.split("").join(" ") : "",
        readOnly: hasPreview,
      };
    }

    if (field.name === "email") {
      return {
        ...field,
        defaultValue: preview?.email ?? "",
        readOnly: hasPreview,
      };
    }

    return field;
  });

  const childInitial = preview
    ? preview.child_display_name.trim().charAt(0).toUpperCase()
    : "";

  return (
    <div className={PAGE_CLASSES}>
      <main className={MAIN_CLASSES}>
        <header className={HEADER_CLASSES}>
          <BrandLockup brand={brand} className="mb-6" variant="light" />

          <h1 className={TITLE_CLASSES}>{header.title}</h1>
          <p className={SUBTITLE_CLASSES}>{header.body}</p>
        </header>

        {preview ? (
          <section className={CHILD_CARD_CLASSES}>
            <div aria-hidden="true" className={CHILD_AVATAR_CLASSES}>
              {childInitial}
            </div>

            <div className="flex flex-col">
              <span className={CHILD_LABEL_CLASSES}>{child.invitationLabel}</span>
              <span className={CHILD_NAME_CLASSES}>
                {preview.child_display_name} · {preview.classroom_name}
              </span>
            </div>
          </section>
        ) : null}

        <ActivateAccountForm
          consentLabel={consent.label}
          fields={formFields}
          notice={hasPreview ? undefined : INVALID_INVITATION_MESSAGE}
          submitLabel={submitLabel}
        />
      </main>
    </div>
  );
}
