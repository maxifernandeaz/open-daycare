import KpiCard from "./KpiCard";
import { classroomPanel } from "@/data/mock-classroom";

export default function KpiRow() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {classroomPanel.kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </section>
  );
}
