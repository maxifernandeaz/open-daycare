import type { MetricCard } from "@/data/mock";
import Icon from "@/app/components/Icons";

type MetricCardsProps = {
  metrics: MetricCard[];
};

const iconContainerByCard: Record<MetricCard["id"], string> = {
  food: "bg-primary/10 text-primary",
  nap: "bg-secondary-fixed text-on-secondary-fixed",
  hygiene: "bg-tertiary-fixed text-on-tertiary-fixed",
  mood: "bg-primary-container/20 text-on-primary-container",
};

const badgeByCard: Record<MetricCard["id"], string> = {
  food: "bg-primary-container/15 text-on-primary-container",
  nap: "bg-secondary-fixed/50 text-secondary animate-pulse",
  hygiene: "bg-tertiary-fixed/60 text-on-tertiary-container",
  mood: "bg-primary-fixed/50 text-on-primary-fixed-variant",
};

const progressFillByCard: Partial<Record<MetricCard["id"], string>> = {
  food: "bg-primary-container",
  nap: "bg-secondary-container",
};

const footnoteByCard: Partial<
  Record<MetricCard["id"], { icon: string; iconClass: string; rowClass: string }>
> = {
  hygiene: { icon: "verified", iconClass: "text-primary", rowClass: "text-primary" },
  mood: {
    icon: "favorite",
    iconClass: "text-tertiary-container",
    rowClass: "text-on-surface-variant",
  },
};

export default function MetricCards({ metrics }: MetricCardsProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const footnote = footnoteByCard[metric.id];
        return (
          <div
            key={metric.id}
            className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
          >
            <div className="flex items-start justify-between">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  iconContainerByCard[metric.id]
                }`}
              >
                <Icon name={metric.icon} size={24} fill={metric.id === "nap"} />
              </div>
              <span
                className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm font-bold ${
                  badgeByCard[metric.id]
                }`}
              >
                {metric.badge}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                {metric.label}
              </span>
              {metric.id === "nap" ? (
                <div className="flex items-baseline gap-2">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">
                    {metric.title}
                  </h3>
                  <span className="font-label-sm text-label-sm text-secondary">
                    en curso
                  </span>
                </div>
              ) : (
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  {metric.title}
                </h3>
              )}
              <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                {metric.description}
              </p>
            </div>
            {footnote ? (
              <div
                className={`flex items-center gap-2 font-label-sm text-label-sm ${footnote.rowClass}`}
              >
                <Icon name={footnote.icon} size={16} className={footnote.iconClass} />
                <span>{metric.footnote}</span>
              </div>
            ) : metric.progress !== undefined ? (
              <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                <div
                  className={`${progressFillByCard[metric.id]} h-full rounded-full`}
                  style={{ width: `${metric.progress}%` }}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}