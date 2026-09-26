"use client";

import type { HomeConfig } from "@/data/mock";
import Icon from "@/app/components/Icons";

type SafetySidebarProps = {
  config: HomeConfig;
  childName: string;
  onNotify?: (message: string) => void;
  onOpenAuth?: () => void;
};

export default function SafetySidebar({
  config,
  childName,
  onNotify,
  onOpenAuth,
}: SafetySidebarProps) {
  return (
    <aside className="lg:col-span-4 flex flex-col gap-6">
      <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-container/20 text-on-primary-container flex items-center justify-center">
              <Icon name="verified_user" size={20} />
            </div>
            <h2 className="font-title-md text-title-md text-on-surface">
              Recogida Segura de Hoy
            </h2>
          </div>
          <span className="font-label-sm text-label-sm text-secondary bg-secondary-fixed/50 px-2.5 py-0.5 rounded-full font-bold">
            {config.dates.pickupTime}
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Indica con antelación quién vendrá a recoger a {childName} para agilizar
          el protocolo con el lector en puerta.
        </p>
        <div className="flex flex-col gap-3">
          {config.authorizedPeople.map((person, index) => {
            const selected = index === 0;
            return (
              <label
                key={person.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-colors ${
                  selected
                    ? "bg-primary/5 hover:bg-primary/10 shadow-sm"
                    : "bg-surface-container-low hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    className="w-4 h-4 text-primary-container focus:ring-primary accent-primary"
                    defaultChecked={selected}
                    name="pickupPerson"
                    type="radio"
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-title-md text-title-md text-on-surface">
                        {person.name}
                      </span>
                      {selected && (
                        <span className="px-2 py-0.2 rounded-md bg-primary-container text-on-primary font-label-sm text-label-sm font-bold">
                          {person.badge}
                        </span>
                      )}
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {person.relation} · {person.dni}
                    </span>
                  </div>
                </div>
                {selected ? (
                  <Icon name="check_circle" size={20} fill className="text-primary" />
                ) : (
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {person.badge}
                  </span>
                )}
              </label>
            );
          })}
        </div>
        <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col items-center text-center gap-3">
          <div className="flex items-center justify-between w-full">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Pase Digital de Seguridad
            </span>
            <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-bold">
              <Icon name="lock" size={14} /> Válido hoy
            </span>
          </div>
          <div className="bg-surface-container-lowest p-3 rounded-2xl shadow-sm flex flex-col items-center">
            <svg
              className="w-36 h-36 text-on-surface"
              fill="currentColor"
              role="img"
              viewBox="0 0 100 100"
            >
              <title>Código QR del pase digital</title>
              <rect height="28" rx="4" width="28" x="10" y="10" />
              <rect fill="white" height="18" rx="2" width="18" x="15" y="15" />
              <rect height="10" rx="1" width="10" x="19" y="19" />
              <rect height="28" rx="4" width="28" x="62" y="10" />
              <rect fill="white" height="18" rx="2" width="18" x="67" y="15" />
              <rect height="10" rx="1" width="10" x="71" y="19" />
              <rect height="28" rx="4" width="28" x="10" y="62" />
              <rect fill="white" height="18" rx="2" width="18" x="15" y="67" />
              <rect height="10" rx="1" width="10" x="19" y="71" />
              <rect height="6" rx="2" width="12" x="44" y="12" />
              <rect height="12" rx="1" width="6" x="44" y="24" />
              <rect height="6" rx="1" width="6" x="54" y="30" />
              <rect height="8" rx="2" width="8" x="12" y="44" />
              <rect height="6" rx="1" width="14" x="24" y="44" />
              <rect fill="#10B981" height="12" rx="2" width="12" x="44" y="44" />
              <rect height="14" rx="1" width="6" x="62" y="44" />
              <rect height="6" rx="1" width="16" x="74" y="44" />
              <rect height="14" rx="2" width="8" x="44" y="62" />
              <rect height="6" rx="1" width="14" x="56" y="62" />
              <rect height="14" rx="2" width="14" x="76" y="56" />
              <rect height="16" rx="2" width="10" x="62" y="74" />
              <rect height="14" rx="2" width="12" x="78" y="76" />
              <rect height="8" rx="2" width="12" x="44" y="82" />
            </svg>
            <div className="mt-2 text-center">
              <span className="font-headline-sm text-headline-sm tracking-widest font-mono text-on-surface">
                {config.passCode}
              </span>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Código PIN de respaldo
              </p>
            </div>
          </div>
          <button
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-bold hover:bg-primary transition-all shadow-sm active:scale-98"
            onClick={() =>
              onNotify?.("Enlace y código QR seguro copiados para enviar a la Abuela Carmen")
            }
            type="button"
          >
            <Icon name="share" size={18} />
            Enviar QR a la Abuela Carmen (WhatsApp)
          </button>
        </div>
        <button
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container text-secondary font-label-md text-label-md font-semibold transition-colors"
          onClick={() => onOpenAuth?.()}
          type="button"
        >
          <Icon name="person_add" size={18} />
          + Autorizar a otra persona (permanente / puntual)
        </button>
      </section>

      <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-error-container/20 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-error-container text-on-error-container flex items-center justify-center">
            <Icon name="medical_services" size={22} fill />
          </div>
          <div>
            <h3 className="font-title-md text-title-md text-on-surface">
              {config.medicalProtocol.title}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {config.medicalProtocol.subtitle}
            </p>
          </div>
        </div>
        <div className="bg-error-container/30 p-3.5 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-on-error-container font-title-md text-title-md">
            <Icon name="shield" size={18} />
            <span>{config.medicalProtocol.alertTitle}</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {config.medicalProtocol.alertText}
          </p>
        </div>
        <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant pt-1">
          <span>Última actualización: {config.dates.protocolUpdatedAt}</span>
          <a
            className="text-secondary hover:underline font-semibold"
            href="#"
            onClick={(event) => {
              event.preventDefault();
              onNotify?.("Abriendo informe médico de Mateo...");
            }}
          >
            {config.medicalProtocol.ctaLabel}
          </a>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <Icon name="campaign" size={22} className="text-tertiary" />
          <h3 className="font-title-md text-title-md text-on-surface">
            Avisos del {config.classroomName}
          </h3>
        </div>
        <div className="flex flex-col gap-3">
          {config.notices.map((notice) => (
            <div
              key={notice.id}
              className="p-3.5 rounded-2xl bg-surface-container-low flex items-start gap-3"
            >
              <Icon
                name={notice.icon}
                size={20}
                className={`mt-0.5 ${
                  notice.icon === "rainy" ? "text-secondary" : "text-primary"
                }`}
              />
              <div className="flex flex-col gap-0.5">
                <span className="font-title-md text-title-md text-on-surface">
                  {notice.title}
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {notice.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}