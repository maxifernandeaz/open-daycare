import { cookies } from "next/headers";
import type { HealthTag, Tone } from "@/data/mock-classroom";
import { createClient } from "@/utils/supabase/server";
import {
  formatCreatedAt,
  getAgeLabel,
  getAllergyLabels,
  getHealthTag,
  getInitials,
  getScheduleLabel,
} from "./formatters";

export type RosterStudent = {
  id: string;
  name: string;
  nickname: string | null;
  initials: string;
  ageLabel: string;
  classroomName: string;
  classroomSlug: string;
  educatorName: string | null;
  scheduleLabel: string;
  healthTag: HealthTag | null;
  createdLabel: string;
  createdAtIso: string;
};

export type HealthProtocol = {
  id: string;
  childName: string;
  tag: string;
  tagTone: Tone;
  dotTone: Tone;
  description: string;
};

export type ClassroomPanelData = {
  students: RosterStudent[];
  protocols: HealthProtocol[];
  totalChildren: number;
  error: string | null;
};

type ChildAllergyEntry = {
  label: string;
  isNone: boolean;
  notes: string | null;
};

const LOAD_ERROR = "No se pudieron cargar los niños.";

const EMPTY_PANEL_DATA: ClassroomPanelData = {
  students: [],
  protocols: [],
  totalChildren: 0,
  error: null,
};

export async function getClassroomPanelData(): Promise<ClassroomPanelData> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [
    childrenResult,
    classroomsResult,
    profilesResult,
    healthResult,
    childAllergiesResult,
    allergiesResult,
  ] = await Promise.all([
    supabase
      .from("children")
      .select(
        "id, full_name, nickname, birth_date, classroom_id, primary_educator_id, schedule, created_at",
      )
      .order("created_at", { ascending: false })
      .order("full_name", { ascending: true }),
    supabase.from("classrooms").select("id, name, slug"),
    supabase.from("profiles").select("id, full_name"),
    supabase
      .from("child_health")
      .select(
        "child_id, urgent_medical_flag, medication_consent, nap_notes",
      ),
    supabase.from("child_allergies").select("child_id, allergy_id, notes"),
    supabase.from("allergies").select("id, code, label, is_none"),
  ]);

  if (
    childrenResult.error ||
    classroomsResult.error ||
    profilesResult.error ||
    healthResult.error ||
    childAllergiesResult.error ||
    allergiesResult.error
  ) {
    return { ...EMPTY_PANEL_DATA, error: LOAD_ERROR };
  }

  const classroomsById = new Map(
    classroomsResult.data.map((classroom) => [classroom.id, classroom]),
  );
  const profilesById = new Map(
    profilesResult.data.map((profile) => [profile.id, profile]),
  );
  const healthByChildId = new Map(
    healthResult.data.map((health) => [health.child_id, health]),
  );
  const allergiesById = new Map(
    allergiesResult.data.map((allergy) => [allergy.id, allergy]),
  );

  const allergiesByChildId = new Map<string, ChildAllergyEntry[]>();

  for (const childAllergy of childAllergiesResult.data) {
    const allergy = allergiesById.get(childAllergy.allergy_id);

    if (!allergy) {
      continue;
    }

    const entries = allergiesByChildId.get(childAllergy.child_id) ?? [];

    entries.push({
      label: allergy.label,
      isNone: allergy.is_none,
      notes: childAllergy.notes,
    });

    allergiesByChildId.set(childAllergy.child_id, entries);
  }

  const students: RosterStudent[] = childrenResult.data.map((child) => {
    const classroom = classroomsById.get(child.classroom_id);
    const educator = child.primary_educator_id
      ? profilesById.get(child.primary_educator_id)
      : undefined;
    const allergyEntries = allergiesByChildId.get(child.id) ?? [];
    const allergyLabels = getAllergyLabels(allergyEntries);
    const urgent = healthByChildId.get(child.id)?.urgent_medical_flag ?? false;

    return {
      id: child.id,
      name: child.full_name,
      nickname: child.nickname,
      initials: getInitials(child.full_name),
      ageLabel: getAgeLabel(child.birth_date),
      classroomName: classroom?.name ?? "Sin aula",
      classroomSlug: classroom?.slug ?? "",
      educatorName: educator?.full_name ?? null,
      scheduleLabel: getScheduleLabel(child.schedule),
      healthTag: getHealthTag(allergyLabels, urgent),
      createdLabel: formatCreatedAt(child.created_at),
      createdAtIso: child.created_at,
    };
  });

  const protocols: HealthProtocol[] = childrenResult.data.flatMap((child) => {
    const allergyEntries = allergiesByChildId.get(child.id) ?? [];
    const allergyLabels = getAllergyLabels(allergyEntries);
    const urgent = healthByChildId.get(child.id)?.urgent_medical_flag ?? false;

    if (allergyLabels.length === 0 && !urgent) {
      return [];
    }

    const firstNote = allergyEntries
      .filter((entry) => !entry.isNone)
      .map((entry) => entry.notes?.trim())
      .find((note): note is string => Boolean(note));

    const baseDescription =
      firstNote ??
      (allergyLabels.length > 0
        ? `Alergias registradas: ${allergyLabels.join(" · ")}.`
        : "");

    const description = urgent
      ? baseDescription
        ? `${baseDescription} Aviso médico urgente activado.`
        : "Aviso médico urgente activado."
      : baseDescription;

    const tone: Tone = urgent ? "error" : "tertiary";

    return [
      {
        id: `protocol-${child.id}`,
        childName: child.full_name,
        tag: allergyLabels.length > 0 ? allergyLabels.join(" · ") : "Alerta médica",
        tagTone: tone,
        dotTone: tone,
        description,
      },
    ];
  });

  return {
    students,
    protocols,
    totalChildren: childrenResult.data.length,
    error: null,
  };
}
