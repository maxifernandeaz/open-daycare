"use server";

import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

export type ChildFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<
    Record<"full_name" | "birth_date" | "classroom_id" | "allergies", string>
  >;
  childId?: string;
};

type ChildField = keyof NonNullable<ChildFormState["fieldErrors"]>;

const GENDER_VALUES: Database["public"]["Enums"]["gender"][] = [
  "boy",
  "girl",
  "other",
];

const SCHEDULE_VALUES: Database["public"]["Enums"]["schedule"][] = [
  "full_day",
  "mornings_with_lunch",
  "mornings_only",
  "afternoon",
];

const DEFAULT_SCHEDULE: Database["public"]["Enums"]["schedule"] = "full_day";

const SUCCESS_MESSAGE = "Niño registrado correctamente";
const GENERIC_ERROR = "No se pudo registrar al niño. Inténtalo de nuevo.";

const isGender = (value: string) =>
  GENDER_VALUES.some((gender) => gender === value);

const isSchedule = (value: string) =>
  SCHEDULE_VALUES.some((schedule) => schedule === value);

const readText = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

const isValidDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const todayIsoDate = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${today.getFullYear()}-${month}-${day}`;
};

const parseAllergyCodes = (formData: FormData) =>
  Array.from(
    new Set(
      readText(formData, "allergy_codes")
        .split(",")
        .map((code) => code.trim())
        .filter(Boolean),
    ),
  );

export async function createChild(
  _previousState: ChildFormState,
  formData: FormData,
): Promise<ChildFormState> {
  const fullName = readText(formData, "full_name");
  const birthDate = readText(formData, "birth_date");
  const classroomId = readText(formData, "classroom_id");
  const gender = readText(formData, "gender");
  const document = readText(formData, "document");
  const nickname = readText(formData, "nickname");
  const primaryEducatorId = readText(formData, "primary_educator_id");
  const scheduleInput = readText(formData, "schedule");
  const pediatricianName = readText(formData, "pediatrician_name");
  const pediatricianPhone = readText(formData, "pediatrician_phone");
  const napNotes = readText(formData, "nap_notes");
  const allergyNotes = readText(formData, "allergy_notes");
  const medicationConsent = formData.has("medication_consent");
  const urgentMedicalFlag = formData.has("urgent_medical_flag");
  const allergyCodes = parseAllergyCodes(formData);

  const fieldErrors: Partial<Record<ChildField, string>> = {};

  if (!fullName) {
    fieldErrors.full_name = "El nombre es obligatorio.";
  }

  if (!birthDate) {
    fieldErrors.birth_date = "La fecha de nacimiento es obligatoria.";
  } else if (!isValidDate(birthDate)) {
    fieldErrors.birth_date = "La fecha de nacimiento no es válida.";
  } else if (birthDate > todayIsoDate()) {
    fieldErrors.birth_date = "La fecha de nacimiento no puede ser futura.";
  }

  if (!classroomId) {
    fieldErrors.classroom_id = "Selecciona una sala.";
  }

  if (allergyCodes.length === 0) {
    fieldErrors.allergies = "Selecciona al menos una alergia.";
  } else if (allergyCodes.includes("none") && allergyCodes.length > 1) {
    fieldErrors.allergies =
      'La opción "Sin alergias" no puede combinarse con otras.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", fieldErrors };
  }

  if (!isGender(gender)) {
    return { status: "error", message: "Selecciona un género válido." };
  }

  if (scheduleInput && !isSchedule(scheduleInput)) {
    return { status: "error", message: "Selecciona un horario válido." };
  }

  const schedule = scheduleInput
    ? (scheduleInput as Database["public"]["Enums"]["schedule"])
    : DEFAULT_SCHEDULE;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: classroom, error: classroomError } = await supabase
    .from("classrooms")
    .select("id")
    .eq("id", classroomId)
    .maybeSingle();

  if (classroomError || !classroom) {
    return {
      status: "error",
      fieldErrors: { classroom_id: "Selecciona una sala válida." },
    };
  }

  const { data: childId, error } = await supabase.rpc("create_child", {
    p_full_name: fullName,
    p_nickname: nickname,
    p_birth_date: birthDate,
    p_gender: gender as Database["public"]["Enums"]["gender"],
    p_document: document,
    p_classroom_id: classroomId,
    p_primary_educator_id: (primaryEducatorId || null) as unknown as string,
    p_schedule: schedule,
    p_pediatrician_name: pediatricianName,
    p_pediatrician_phone: pediatricianPhone,
    p_nap_notes: napNotes,
    p_medication_consent: medicationConsent,
    p_urgent_medical_flag: urgentMedicalFlag,
    p_allergy_codes: allergyCodes,
    p_allergy_notes: allergyNotes,
  });

  if (error || !childId) {
    const rpcErrorMessage = error?.message.toLowerCase() ?? "";

    if (rpcErrorMessage.includes("aula no existe")) {
      return {
        status: "error",
        fieldErrors: { classroom_id: "Selecciona una sala válida." },
      };
    }

    if (rpcErrorMessage.includes("código de alergia")) {
      return {
        status: "error",
        fieldErrors: { allergies: "Selecciona alergias válidas." },
      };
    }

    return { status: "error", message: GENERIC_ERROR };
  }

  return { status: "success", message: SUCCESS_MESSAGE, childId };
}
