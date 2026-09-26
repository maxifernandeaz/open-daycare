import type { Metadata } from "next";
import ActionDock from "@/app/components/panel-aula/ActionDock";
import ActivityLogPanel from "@/app/components/panel-aula/ActivityLogPanel";
import AppHeader from "@/app/components/panel-aula/AppHeader";
import AppSidebar from "@/app/components/panel-aula/AppSidebar";
import HealthProtocolsPanel from "@/app/components/panel-aula/HealthProtocolsPanel";
import KpiRow from "@/app/components/panel-aula/KpiRow";
import NextActivityBanner from "@/app/components/panel-aula/NextActivityBanner";
import OpsHero from "@/app/components/panel-aula/OpsHero";
import PickupQueuePanel from "@/app/components/panel-aula/PickupQueuePanel";
import StudentRoster from "@/app/components/panel-aula/StudentRoster";
import { MAIN_TOP_CLASS, SIDEBAR_OFFSET_CLASS } from "@/app/components/panel-aula/shell";

export const metadata: Metadata = {
  title: "KiddiCare · Panel de Aula",
  description:
    "Monitor operativo del aula: asistencia, comedor, siesta, recogidas y protocolos de salud en tiempo real.",
};

export default function PanelAulaPage() {
  return (
    <>
      <AppSidebar />
      <AppHeader />
      <main
        className={`relative ${MAIN_TOP_CLASS} ${SIDEBAR_OFFSET_CLASS} w-full px-8 bg-background min-h-screen`}
      >
        <div className="flex flex-col w-full pb-16 space-y-6">
          <OpsHero />
          <KpiRow />
          <ActionDock />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-4">
              <StudentRoster />
              <NextActivityBanner />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <HealthProtocolsPanel />
              <PickupQueuePanel />
              <ActivityLogPanel />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
