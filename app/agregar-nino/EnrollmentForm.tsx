"use client";

import { useActionState, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { createChild, type ChildFormState } from "@/app/agregar-nino/actions";
import StickyActionBar from "@/app/components/agregar-nino/StickyActionBar";
import Icon from "@/app/components/Icons";

const INITIAL_STATE: ChildFormState = { status: "idle" };

const SUCCESS_BANNER_CLASSES =
  "mb-6 rounded-2xl border border-primary/30 bg-primary-fixed px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3";

const ERROR_BANNER_CLASSES =
  "mb-6 rounded-2xl border border-error/30 bg-error-container px-4 py-4 text-on-error-container";

const AGE_WARNING_CLASSES =
  "mb-6 rounded-2xl border border-tertiary/30 bg-tertiary-fixed px-4 py-3 flex items-start gap-3 text-on-tertiary-fixed";

export type ClassroomAgeRange = {
  id: string;
  name: string;
  ageMinMonths: number;
  ageMaxMonths: number;
};

function getAgeInMonths(birthDate: string, today = new Date()): number | null {
  const [year, month, day] = birthDate.split("-").map(Number);
  if (!year || !month || !day) return null;

  let months =
    (today.getFullYear() - year) * 12 + (today.getMonth() + 1 - month);

  if (today.getDate() < day) months -= 1;

  return months;
}

function getAgeWarning(
  formData: FormData,
  classroomAgeRanges: ClassroomAgeRange[],
): string | null {
  const birthDate = String(formData.get("birth_date") ?? "");
  const classroomId = String(formData.get("classroom_id") ?? "");
  const ageInMonths = getAgeInMonths(birthDate);
  const classroom = classroomAgeRanges.find((range) => range.id === classroomId);

  if (ageInMonths === null || !classroom) return null;

  if (
    ageInMonths >= classroom.ageMinMonths &&
    ageInMonths <= classroom.ageMaxMonths
  ) {
    return null;
  }

  return `La edad calculada (${ageInMonths} meses) está fuera del rango sugerido para ${classroom.name} (${classroom.ageMinMonths}–${classroom.ageMaxMonths} meses). Puedes guardar la ficha igualmente.`;
}

type EnrollmentFormProps = {
  header: ReactNode;
  children: ReactNode;
  classroomAgeRanges: ClassroomAgeRange[];
};

export default function EnrollmentForm({
  header,
  children,
  classroomAgeRanges,
}: EnrollmentFormProps) {
  const [state, formAction] = useActionState(createChild, INITIAL_STATE);
  const [warningState, setWarningState] = useState<{
    formKey: string;
    message: string | null;
  }>({ formKey: "initial", message: null });
  const fieldErrorMessages = Object.values(state.fieldErrors ?? {}).filter(
    (message): message is string => Boolean(message),
  );
  const resetKey =
    state.status === "success" ? (state.childId ?? "success") : "initial";
  const ageWarning =
    warningState.formKey === resetKey ? warningState.message : null;

  const handleFormChange = (event: FormEvent<HTMLFormElement>) => {
    setWarningState({
      formKey: resetKey,
      message: getAgeWarning(new FormData(event.currentTarget), classroomAgeRanges),
    });
  };

  return (
    <form
      action={formAction}
      className="w-full"
      id="childEnrollmentForm"
      onChange={handleFormChange}
    >
      {header}

      {state.status === "success" ? (
        <div className={SUCCESS_BANNER_CLASSES} role="status">
          <div className="flex items-start gap-3">
            <Icon className="text-primary" name="check_circle" size={22} />
            <div>
              <p className="font-label-lg text-label-lg text-on-primary-fixed font-bold">
                {state.message}
              </p>
              <p className="font-body-sm text-body-sm text-on-primary-fixed-variant">
                La ficha se guardó en el sistema y el formulario quedó listo para
                un nuevo registro.
              </p>
            </div>
          </div>
          <a
            className="inline-flex items-center justify-center gap-2 self-start sm:self-auto px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:shadow-lg transition-all duration-200"
            href="/panel-aula"
          >
            <Icon name="arrow_forward" size={18} />
            <span>Ir al Panel de Aula</span>
          </a>
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className={ERROR_BANNER_CLASSES} role="alert">
          <p className="font-label-lg text-label-lg font-bold">
            {state.message ?? "Revisa los datos del formulario."}
          </p>
          {fieldErrorMessages.length > 0 ? (
            <ul className="mt-2 list-disc pl-5 font-body-sm text-body-sm">
              {fieldErrorMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {ageWarning ? (
        <div className={AGE_WARNING_CLASSES} role="status">
          <Icon className="text-tertiary" name="warning" size={20} />
          <p className="font-body-sm text-body-sm">{ageWarning}</p>
        </div>
      ) : null}

      <div key={resetKey}>{children}</div>

      <StickyActionBar />
    </form>
  );
}
