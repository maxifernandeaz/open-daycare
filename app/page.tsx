/* eslint-disable @next/next/no-img-element */

import ChildSummary from "@/app/components/ChildSummary";
import MetricCards from "@/app/components/MetricCards";
import TeacherHighlight from "@/app/components/TeacherHighlight";
import TimelineSection from "@/app/components/TimelineSection";
import SafetySidebar from "@/app/components/SafetySidebar";
import { dailyHome, homeConfig } from "@/data/mock";

export default function HomePage() {
  const { child, metrics, timeline, highlight } = dailyHome;

  return (
    <>
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
          <ChildSummary child={child} />
          <MetricCards metrics={metrics} />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 flex flex-col gap-6">
              <TeacherHighlight post={highlight} />
              <TimelineSection
                events={timeline}
                feedDate={homeConfig.dates.feedDate}
              />
            </div>
            <SafetySidebar config={homeConfig} childName={child.name} />
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
    </>
  );
}