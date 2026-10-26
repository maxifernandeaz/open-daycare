import { cookies } from "next/headers";
import { classroomVisuals } from "@/data/mock-enrollment";
import { createClient } from "@/utils/supabase/server";

export type ClassroomOption = {
  id: string;
  slug: string;
  name: string;
  ageRange: string;
  tagline: string | null;
  description: string | null;
  ageMinMonths: number;
  ageMaxMonths: number;
  recommended: boolean;
  icon: string;
  vacancyText?: string;
};

export type EducatorOption = { id: string; label: string };
export type AllergyOption = {
  id: string;
  code: string;
  label: string;
  isNone: boolean;
};

export type EnrollmentCatalogs = {
  classrooms: ClassroomOption[];
  educators: EducatorOption[];
  allergies: AllergyOption[];
};

export type EnrollmentCatalogsResult = EnrollmentCatalogs & {
  error: string | null;
};

const EMPTY_CATALOGS: EnrollmentCatalogs = {
  classrooms: [],
  educators: [],
  allergies: [],
};

const CATALOG_ERROR = "No se pudieron cargar los catálogos.";

export async function getEnrollmentCatalogs(): Promise<EnrollmentCatalogsResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [classroomsResult, allergiesResult, educatorsResult] = await Promise.all([
    supabase
      .from("classrooms")
      .select(
        "id, slug, name, age_range, tagline, description, age_min_months, age_max_months, recommended",
      )
      .order("age_min_months", { ascending: true }),
    supabase
      .from("allergies")
      .select("id, code, label, is_none")
      .order("is_none", { ascending: false })
      .order("label", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .in("role", ["admin", "director", "educator"])
      .eq("status", "active")
      .order("full_name", { ascending: true }),
  ]);

  if (classroomsResult.error || allergiesResult.error || educatorsResult.error) {
    return { ...EMPTY_CATALOGS, error: CATALOG_ERROR };
  }

  const classrooms: ClassroomOption[] = classroomsResult.data.map((classroom) => {
    const visual = classroomVisuals[classroom.slug];

    return {
      id: classroom.id,
      slug: classroom.slug,
      name: classroom.name,
      ageRange: classroom.age_range,
      tagline: classroom.tagline,
      description: classroom.description,
      ageMinMonths: classroom.age_min_months,
      ageMaxMonths: classroom.age_max_months,
      recommended: classroom.recommended,
      icon: visual?.icon ?? "meeting_room",
      vacancyText: visual?.vacancy.text,
    };
  });

  const allergies: AllergyOption[] = allergiesResult.data.map((allergy) => ({
    id: allergy.id,
    code: allergy.code,
    label: allergy.label,
    isNone: allergy.is_none,
  }));

  const educators: EducatorOption[] = educatorsResult.data.map((educator) => ({
    id: educator.id,
    label: educator.full_name,
  }));

  return { classrooms, allergies, educators, error: null };
}
