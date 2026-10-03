import type { Metadata } from "next";
import ClassroomSection from "@/app/components/agregar-nino/ClassroomSection";
import HealthSection from "@/app/components/agregar-nino/HealthSection";
import IdentitySection from "@/app/components/agregar-nino/IdentitySection";
import PageHeader from "@/app/components/agregar-nino/PageHeader";
import SpecialCareSection from "@/app/components/agregar-nino/SpecialCareSection";
import StickyActionBar from "@/app/components/agregar-nino/StickyActionBar";
import AppHeader from "@/app/components/panel-aula/AppHeader";
import AppSidebar from "@/app/components/panel-aula/AppSidebar";
import {
  MAIN_TOP_CLASS,
  SIDEBAR_OFFSET_CLASS,
} from "@/app/components/panel-aula/shell";

export const metadata: Metadata = {
  title: "KiddiCare · Agregar Nuevo Niño",
  description:
    "Alta completa de un niño en un solo formulario: datos personales e identidad, asignación de sala, alergias, salud, siesta y cuidados especiales.",
};

export default function AgregarNinoPage() {
  return (
    <>
      <AppSidebar activePath="alumnos-y-familias" />
      <AppHeader />
      <main
        className={`relative ${MAIN_TOP_CLASS} ${SIDEBAR_OFFSET_CLASS} w-full px-8 bg-background min-h-screen font-body-md text-body-md`}
      >
        <div className="flex flex-col w-full pb-28">
          <div className="relative w-full max-w-7xl mx-auto pt-6 px-4">
            <PageHeader />
            <form
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
              id="childEnrollmentForm"
            >
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-8">
                <IdentitySection />
                <ClassroomSection />
              </div>
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-8">
                <HealthSection />
                <SpecialCareSection />
              </div>
            </form>
          </div>
        </div>
      </main>
      <StickyActionBar />
    </>
  );
}
