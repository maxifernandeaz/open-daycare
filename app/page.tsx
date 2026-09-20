"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import ChildSummary from "@/app/components/ChildSummary";
import MetricCards from "@/app/components/MetricCards";
import TeacherHighlight from "@/app/components/TeacherHighlight";
import TimelineSection from "@/app/components/TimelineSection";
import SafetySidebar from "@/app/components/SafetySidebar";
import PickupModal from "@/app/components/PickupModal";
import Toast from "@/app/components/Toast";
import { dailyHome, homeConfig, type AuthorizedPerson } from "@/data/mock";

export default function HomePage() {
  const { child, metrics, timeline, highlight } = dailyHome;

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authorizedPeople, setAuthorizedPeople] = useState<AuthorizedPerson[]>(
    homeConfig.authorizedPeople
  );

  const notify = (message: string) => setToastMessage(message);

  const openAuthModal = () => setAuthModalOpen(true);
  const closeAuthModal = () => setAuthModalOpen(false);

  const confirmAuth = (personName: string) => {
    setAuthModalOpen(false);
    const newPerson: AuthorizedPerson = {
      id: `person-${Date.now()}`,
      name: personName,
      relation: "Familiar autorizado",
      dni: "DNI nuevo",
      badge: "Hoy",
    };
    setAuthorizedPeople((people) => [...people, newPerson]);
    notify(`Autorización creada con éxito para ${personName}. Pase QR disponible.`);
  };

  const config = { ...homeConfig, authorizedPeople };

  return (
    <>
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
          <ChildSummary child={child} onNotify={notify} onOpenAuth={openAuthModal} />
          <MetricCards metrics={metrics} />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 flex flex-col gap-6">
              <TeacherHighlight post={highlight} onNotify={notify} />
              <TimelineSection
                events={timeline}
                feedDate={homeConfig.dates.feedDate}
              />
            </div>
            <SafetySidebar
              config={config}
              childName={child.name}
              onNotify={notify}
              onOpenAuth={openAuthModal}
            />
          </div>
        </div>
      </main>
      <footer className="bg-surface-container-lowest border-t-0 mt-12 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              alt="KiddiCare Logo"
              className="h-6 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida/AEtjO1UZif4Cbii6aEAAPYFJqAvBq-tlGhv7lv8fXT0447lsTcBKyllhfQMgMQubETVvzcx_9qXVqYLs0o4wLM9q6UFa1f3Ocr3WpFbz6ReeAVk2j5JvHNNopw5xvAHJLQ6OnBJSOD_i7urMryXOeXgYbSMa9mBjNHJTlJWmur1ftvIcHZOz4HV4CFyU_H46dX6qj5ZdT8Tjj3a4M-7O0_KPs5GGm6cq7anJFHxvO1hnSaL2AJu4LtG7dfUrbpk"
            />
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              © 2024 KiddiCare. Todos los derechos reservados · Centro Infantil Sol
            </span>
          </div>
          <div className="flex items-center gap-6 font-label-md text-label-md text-on-surface-variant">
            <a className="hover:text-primary transition-colors" href="#">
              Privacidad infantil
            </a>
            <a className="hover:text-primary transition-colors" href="#">
              Protocolos de seguridad
            </a>
            <a className="hover:text-primary transition-colors" href="#">
              Contacto pedagógico
            </a>
          </div>
        </div>
      </footer>
      <PickupModal
        childName={child.name}
        onClose={closeAuthModal}
        onConfirm={confirmAuth}
        open={authModalOpen}
      />
      <Toast message={toastMessage} />
    </>
  );
}