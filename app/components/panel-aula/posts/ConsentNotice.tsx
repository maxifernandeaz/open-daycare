"use client";

import { useEffect, useState } from "react";
import Icon from "@/app/components/Icons";
import { getPhotoConsentCount } from "@/app/panel-aula/entradas/actions";

const STATIC_NOTICE =
  "Aviso de consentimiento de imágenes: las fotos solo pueden incluir a niños con autorización firmada por su familia. Si una familia no autorizó, evitá publicar imágenes donde aparezca su hijo.";

const COUNT_ERROR_NOTICE =
  "No se pudo verificar el consentimiento de imágenes. Podés publicar igual, pero revisá las autorizaciones antes de subir fotos.";

const NOTICE_CLASSES =
  "flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 font-body-sm text-body-sm text-on-surface-variant";

const COUNT_ALERT_CLASSES =
  "flex items-start gap-3 rounded-xl border border-tertiary/40 bg-tertiary-fixed px-4 py-3 font-body-sm text-body-sm text-on-tertiary-fixed";

const COUNT_ERROR_CLASSES =
  "flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container px-4 py-3 font-body-sm text-body-sm text-on-surface-variant";

type ConsentState =
  | { status: "loading" }
  | { status: "ready"; count: number; classroomId: string | null }
  | { status: "error"; classroomId: string | null };

type ConsentNoticeProps = {
  classroomId: string | null;
};

export default function ConsentNotice({ classroomId }: ConsentNoticeProps) {
  const [consent, setConsent] = useState<ConsentState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    getPhotoConsentCount(classroomId)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setConsent(
          result.ok
            ? { status: "ready", count: result.count, classroomId }
            : { status: "error", classroomId },
        );
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setConsent({ status: "error", classroomId });
      });

    return () => {
      cancelled = true;
    };
  }, [classroomId]);

  const currentConsent: ConsentState =
    consent.status !== "loading" && consent.classroomId === classroomId
      ? consent
      : { status: "loading" };

  return (
    <section
      aria-label="Consentimiento de imágenes"
      className="flex flex-col gap-2"
    >
      <p className={NOTICE_CLASSES}>
        <Icon className="shrink-0 text-primary" name="info" size={20} />
        <span>{STATIC_NOTICE}</span>
      </p>

      {currentConsent.status === "error" ? (
        <p
          aria-live="polite"
          className={COUNT_ERROR_CLASSES}
          role="status"
        >
          <Icon
            className="shrink-0 text-on-surface-variant"
            name="info"
            size={20}
          />
          <span>{COUNT_ERROR_NOTICE}</span>
        </p>
      ) : null}

      {currentConsent.status === "ready" && currentConsent.count > 0 ? (
        <CountAlert classroomId={classroomId} count={currentConsent.count} />
      ) : null}
    </section>
  );
}

type CountAlertProps = {
  classroomId: string | null;
  count: number;
};

function CountAlert({ classroomId, count }: CountAlertProps) {
  const scope = classroomId === null ? "En el centro" : "En esta aula";
  const childLabel = count === 1 ? "niño" : "niños";

  return (
    <p aria-live="polite" className={COUNT_ALERT_CLASSES} role="status">
      <Icon className="shrink-0 text-tertiary" name="visibility_off" size={20} />
      <span>
        {scope} hay {count} {childLabel} sin autorización de imágenes.
      </span>
    </p>
  );
}
