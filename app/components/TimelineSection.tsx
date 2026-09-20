import { Fragment } from "react";

import type { TimelineEvent } from "@/data/mock";
import Icon from "@/app/components/Icons";

type TimelineSectionProps = {
  events: TimelineEvent[];
  feedDate: string;
};

const iconContainerByEvent: Record<string, string> = {
  sleep: "bg-secondary-fixed text-secondary",
  lunch: "bg-primary-container text-on-primary",
  hygiene: "bg-tertiary-fixed text-on-tertiary-fixed",
  activity: "bg-surface-container-highest text-secondary",
  checkin: "bg-primary-fixed text-on-primary-fixed",
};

const metaByTone: Record<
  string,
  { icon?: string; iconClass?: string; labelClass?: string }
> = {
  primary: { icon: "check_circle", iconClass: "text-primary" },
  secondary: { icon: "music_note", iconClass: "text-secondary" },
  onSurfaceVariant: { labelClass: "text-on-surface-variant" },
};

export default function TimelineSection({
  events,
  feedDate,
}: TimelineSectionProps) {
  return (
    <section className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            Bitácora Cronológica de Hoy
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {feedDate}
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-primary-container/15 text-primary font-label-sm text-label-sm font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
          En directo
        </span>
      </div>
      <div className="relative pl-6 sm:pl-8 flex flex-col gap-8 before:absolute before:left-[15px] sm:before:left-[19px] before:top-3 before:bottom-3 before:w-[2px] before:bg-surface-container-high before:content-['']">
        {events.map((event) => {
          const titleChip = event.meta.find((item) => item.tone === "error");
          const metaItems = event.meta.filter((item) => item.tone !== "error");
          return (
            <div key={event.id} className="relative flex items-start gap-4">
              <div
                className={`absolute -left-[27px] sm:-left-[31px] w-8 h-8 rounded-full ${
                  iconContainerByEvent[event.id] ??
                  "bg-surface-container-high text-secondary"
                } flex items-center justify-center shadow-sm`}
              >
                <Icon name={event.icon} size={18} />
              </div>
              <div className="flex-1 bg-surface-container-low rounded-2xl p-4 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-title-md text-title-md text-on-surface">
                      {event.title}
                    </span>
                    {titleChip && (
                      <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">
                        {titleChip.label}
                      </span>
                    )}
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-bold bg-surface-container-lowest px-2.5 py-0.5 rounded-full">
                    {event.time}
                  </span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {event.description}
                </p>
                {metaItems.length > 0 && (
                  <div className="flex items-center gap-3 pt-1 font-label-sm text-label-sm text-primary">
                    {metaItems.map((item, index) => {
                      const meta = metaByTone[item.tone ?? ""] ?? {};
                      return (
                        <Fragment key={item.label}>
                          {index > 0 && <span className="text-outline">·</span>}
                          <span
                            className={`inline-flex items-center gap-1 ${
                              meta.labelClass ?? ""
                            }`}
                          >
                            {meta.icon && (
                              <Icon
                                name={meta.icon}
                                size={16}
                                className={meta.iconClass}
                              />
                            )}
                            {item.label}
                          </span>
                        </Fragment>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}