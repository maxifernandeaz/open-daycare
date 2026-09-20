"use client";

/* eslint-disable @next/next/no-img-element */

import type { ChildInfo } from "@/data/mock";
import Icon from "@/app/components/Icons";

type ChildSummaryProps = {
  child: ChildInfo;
  onNotify?: (message: string) => void;
  onOpenAuth?: () => void;
};

export default function ChildSummary({
  child,
  onNotify,
  onOpenAuth,
}: ChildSummaryProps) {
  return (
    <section className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-1/3 -bottom-24 w-60 h-60 bg-secondary-container/10 rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden shadow-md bg-surface-container-high flex-shrink-0 ring-4 ring-surface-container-lowest">
              <img
                alt={`${child.name} sonriendo feliz en clase`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(event) => {
                  event.currentTarget.src = child.fallbackPhoto;
                }}
                src={child.photo}
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-surface-container-lowest p-1 rounded-full shadow-sm">
              <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-[13px] font-bold">
                {child.avatarEmoji}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-headline-lg text-headline-lg text-on-surface">
                {child.name}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-secondary font-label-md text-label-md">
                <Icon name="child_care" size={16} />
                {child.classroom} · {child.age}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container text-on-error-container font-label-md text-label-md shadow-sm">
                <Icon name="warning" size={15} fill />
                Alergia {child.allergies.join(" · ")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-low">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-container" />
                </span>
                <span className="font-title-md text-title-md text-on-surface">
                  {child.liveStatus.text}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  ({child.liveStatus.since})
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  how_to_reg
                </span>
                Asistencia:{" "}
                <strong className="text-on-surface font-title-md text-title-md">
                  {child.attendance.state}
                </strong>
                {" · "}
                {child.attendance.arrivedAt}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Tutoras a cargo:
              </span>
              {child.tutors.map((tutor) => (
                <span
                  key={tutor.name}
                  className="font-label-md text-label-md text-on-surface bg-surface-container-low px-2 py-0.5 rounded-lg"
                >
                  {tutor.name}
                  {tutor.role ? ` (${tutor.role})` : ""}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap lg:flex-col xl:flex-row items-stretch gap-2.5 w-full lg:w-auto">
          <button
            className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-secondary font-label-lg text-label-lg transition-all shadow-sm active:scale-95"
            onClick={() =>
              onNotify?.("Solicitud de aviso de recogida registrada a las tutoras")
            }
            type="button"
          >
            <Icon name="directions_car" size={18} />
            Avisar Recogida / Retraso
          </button>
          <button
            className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-label-lg text-label-lg transition-all shadow-sm active:scale-95"
            onClick={() => onNotify?.("Modal de notificación de ausencia abierto")}
            type="button"
          >
            <Icon name="event_busy" size={18} />
            Notificar Ausencia
          </button>
          <button
            className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:shadow-md transition-all active:scale-95"
            onClick={() => onOpenAuth?.()}
            type="button"
          >
            <Icon name="person_add" size={18} />
            + Autorizar Puntual
          </button>
        </div>
      </div>
    </section>
  );
}