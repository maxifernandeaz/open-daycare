import type { KpiCard as KpiCardData } from "@/data/mock-classroom";
import KpiCard from "./KpiCard";

type KpiRowProps = {
  totalChildren: number;
};

const EMPTY_KPIS: Omit<KpiCardData, "badge" | "badgeTone" | "value" | "valueTone" | "unit" | "unitTone">[] = [
  {
    id: "canteen",
    icon: "restaurant",
    iconTone: "secondary",
    label: "Comedor & Almuerzo",
  },
  {
    id: "nap",
    icon: "bedtime",
    iconTone: "surface",
    label: "Hora de Sueño",
  },
  {
    id: "pickups",
    icon: "directions_walk",
    iconTone: "tertiary",
    label: "Salidas Previstas",
  },
];

export default function KpiRow({ totalChildren }: KpiRowProps) {
  const attendanceKpi: KpiCardData = {
    id: "attendance",
    icon: "groups",
    iconTone: "primary",
    badge: "Total registrados",
    badgeTone: "primary",
    label: "Asistencia en Aula",
    value: String(totalChildren),
    unit: totalChildren === 1 ? "niño" : "niños",
  };

  const emptyKpis: KpiCardData[] = EMPTY_KPIS.map((kpi) => ({
    ...kpi,
    badge: "Sin datos",
    badgeTone: "outline",
    value: "—",
    valueTone: "outline",
    unit: "",
    unitTone: "outline",
  }));

  const kpis: KpiCardData[] = [attendanceKpi, ...emptyKpis];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </section>
  );
}
