import Icon from "@/app/components/Icons";
import Tag from "./Tag";
import type { KpiCard as KpiCardData, Tone } from "@/data/mock-classroom";

const CARD_CLASSES =
  "p-5 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow";

const ICON_TONE_CLASSES: Record<Tone, string> = {
  primary: "bg-primary-fixed text-on-primary-fixed",
  secondary: "bg-secondary-fixed text-on-secondary-fixed",
  tertiary: "bg-tertiary-fixed text-on-tertiary-fixed",
  error: "bg-error-container text-on-error-container",
  surface: "bg-surface-container-highest text-on-surface",
  outline: "bg-surface-container-low text-on-surface-variant",
};

const TEXT_TONE_CLASSES: Record<Tone, string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  tertiary: "text-tertiary",
  error: "text-error",
  surface: "text-on-surface",
  outline: "text-on-surface-variant",
};

const SEGMENT_TONE_CLASSES: Record<Tone, string> = {
  primary: "bg-primary-container",
  secondary: "bg-secondary",
  tertiary: "bg-tertiary-container",
  error: "bg-error",
  surface: "bg-surface-dim",
  outline: "bg-outline",
};

type KpiCardProps = {
  kpi: KpiCardData;
};

export default function KpiCard({ kpi }: KpiCardProps) {
  const { footnote, progress } = kpi;
  const isPercentageSuffix = kpi.id === "canteen";

  return (
    <article className={CARD_CLASSES}>
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${ICON_TONE_CLASSES[kpi.iconTone]}`}
        >
          <Icon name={kpi.icon} size={22} />
        </div>
        <Tag
          icon={kpi.badgeIcon}
          iconSize={14}
          size="md"
          tone={kpi.badgeTone}
          weight={kpi.badgeIcon ? "bold" : "semibold"}
        >
          {kpi.badge}
        </Tag>
      </div>

      <div className="mt-4">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
          {kpi.label}
        </span>
        <div className="flex items-baseline gap-2 mt-1">
          <span
            className={`font-display-lg text-display-lg ${TEXT_TONE_CLASSES[kpi.valueTone ?? "surface"]}`}
          >
            {kpi.value}
          </span>
          <span
            className={`font-headline-sm text-headline-sm ${TEXT_TONE_CLASSES[kpi.unitTone ?? "outline"]}`}
          >
            {kpi.unit}
          </span>
          {kpi.aside ? (
            <span className="font-body-sm text-body-sm text-on-surface-variant ml-auto">
              {kpi.aside}
            </span>
          ) : null}
        </div>
      </div>

      {progress ? (
        <div
          className={
            isPercentageSuffix
              ? "mt-3 pt-3 flex items-center justify-between font-body-sm text-body-sm"
              : "mt-3 pt-3 flex items-center gap-2"
          }
        >
          <div
            className={
              isPercentageSuffix
                ? "w-full bg-surface-container rounded-full h-2 overflow-hidden mr-3"
                : "flex-1 bg-surface-container rounded-full h-2 flex overflow-hidden"
            }
          >
            {progress.segments.map((segment, index) => (
              <div
                className={`${SEGMENT_TONE_CLASSES[segment.tone]} ${
                  isPercentageSuffix ? "h-2 rounded-full" : "h-full"
                }`}
                key={index}
                style={{ width: `${segment.width}%` }}
              />
            ))}
          </div>
          <span
            className={`font-label-sm text-label-sm font-bold ${TEXT_TONE_CLASSES[progress.suffixTone]}`}
          >
            {progress.suffix}
          </span>
        </div>
      ) : footnote ? (
        <div className="mt-3 pt-3 flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
          {footnote.icon ? (
            <span className="inline-flex items-center gap-1.5 text-on-surface font-label-sm text-label-sm">
              <Icon
                className={TEXT_TONE_CLASSES[footnote.dotTone ?? "surface"]}
                name={footnote.icon}
                size={16}
              />
              {footnote.text}
            </span>
          ) : (
            <span
              className={`flex items-center gap-1 ${TEXT_TONE_CLASSES[footnote.textTone ?? "outline"]}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${SEGMENT_TONE_CLASSES[footnote.dotTone ?? "outline"]}`}
              />
              {footnote.text}
            </span>
          )}
          {kpi.link ? (
            <span
              className={`font-label-sm text-label-sm font-semibold cursor-pointer hover:underline ${TEXT_TONE_CLASSES[kpi.linkTone ?? "primary"]}`}
            >
              {kpi.link}
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
