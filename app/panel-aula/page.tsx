import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/app/components/Icons";
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
import { requireStaff } from "@/utils/auth";
import { getClassroomPanelData } from "./queries";

const PUBLICATIONS_LINK_CLASSES =
  "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-lowest shadow-sm text-on-surface font-label-lg text-label-lg hover:bg-surface-container transition-colors";

export const metadata: Metadata = {
  title: "KiddiCare · Panel de Aula",
  description:
    "Monitor operativo del aula: asistencia, comedor, siesta, recogidas y protocolos de salud en tiempo real.",
};

export default async function PanelAulaPage() {
  const profile = await requireStaff();
  const canInvite =
    profile.role === "admin" ||
    profile.role === "director" ||
    profile.role === "educator";
  const { students, protocols, totalChildren, error } =
    await getClassroomPanelData();

  return (
    <>
      <AppSidebar />
      <AppHeader classroomLabel="Todas las aulas" />
      <main
        className={`relative ${MAIN_TOP_CLASS} ${SIDEBAR_OFFSET_CLASS} w-full bg-background min-h-screen font-body-md text-body-md`}
      >
        <div className="flex flex-col w-full px-8 pb-16 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Compartí novedades del aula con las familias.
            </p>
            <Link
              className={PUBLICATIONS_LINK_CLASSES}
              href="/panel-aula/entradas"
            >
              <Icon className="text-primary" name="campaign" size={20} />
              <span>Publicaciones</span>
            </Link>
          </div>
          <OpsHero />
          <KpiRow totalChildren={totalChildren} />
          <ActionDock
            healthAlertCount={protocols.length}
            totalChildren={totalChildren}
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-4">
              <StudentRoster
                canInvite={canInvite}
                error={error}
                students={students}
                totalChildren={totalChildren}
              />
              <NextActivityBanner />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <HealthProtocolsPanel protocols={protocols} />
              <PickupQueuePanel />
              <ActivityLogPanel />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
