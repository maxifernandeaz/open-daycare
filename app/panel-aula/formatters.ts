import type { HealthTag } from "@/data/mock-classroom";

const SCHEDULE_LABELS: Record<string, string> = {
  full_day: "Jornada completa",
  mornings_with_lunch: "Mañanas con almuerzo",
  mornings_only: "Solo mañanas",
  afternoon: "Solo tardes",
};

const CREATED_AT_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function getAgeLabel(birthDate: string): string {
  const [birthYear, birthMonth] = birthDate.split("-").map(Number);
  const now = new Date();
  const months =
    (now.getFullYear() - birthYear) * 12 + (now.getMonth() + 1 - birthMonth);

  if (months < 36) {
    return `${months} meses`;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  return remainingMonths > 0
    ? `${years} años ${remainingMonths} m`
    : `${years} años`;
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatCreatedAt(value: string): string {
  return CREATED_AT_FORMATTER.format(new Date(value));
}

export function getScheduleLabel(schedule: string | null): string {
  if (!schedule) {
    return "Sin horario";
  }

  return SCHEDULE_LABELS[schedule] ?? "Sin horario";
}

export function getAllergyLabels(
  allergies: { label: string; isNone: boolean }[],
): string[] {
  return allergies
    .filter((allergy) => !allergy.isNone)
    .map((allergy) => allergy.label.trim())
    .filter(Boolean);
}

export function getHealthTag(
  allergyLabels: string[],
  urgent: boolean,
): HealthTag | null {
  if (allergyLabels.length > 0) {
    return {
      icon: "medical_services",
      text: allergyLabels.join(" · "),
      tone: urgent ? "error" : "tertiary",
    };
  }

  if (urgent) {
    return {
      icon: "medical_information",
      text: "Alerta médica",
      tone: "error",
    };
  }

  return null;
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
