import Icon from "@/app/components/Icons";
import PanelCard from "./PanelCard";
import Tag from "./Tag";
import { classroomPanel } from "@/data/mock-classroom";
import type { Tone } from "@/data/mock-classroom";

const TEXT_TONE_CLASSES: Record<Tone, string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  tertiary: "text-tertiary",
  error: "text-error",
  surface: "text-on-surface",
  outline: "text-on-surface-variant",
};

const LIST_CLASSES = "space-y-3";
const TURN_CLASSES = "flex items-start gap-3 p-2.5 rounded-xl bg-surface-container-low";
const TIME_CLASSES =
  "flex flex-col items-center justify-center px-2 py-1 rounded-lg bg-surface-container-lowest text-on-surface";
const TIME_LABEL_CLASSES =
  "font-label-sm text-label-sm text-on-surface-variant font-bold leading-none";
const TIME_VALUE_CLASSES = "font-title-md text-title-md font-bold";
const BODY_CLASSES = "flex-1 min-w-0";
const BODY_HEADER_CLASSES = "flex items-center justify-between";
const CHILD_NAME_CLASSES =
  "font-label-md text-label-md text-on-surface font-bold truncate";
const COLLECTOR_CLASSES =
  "font-body-sm text-body-sm text-on-surface-variant truncate";
const VERIFICATION_CLASSES =
  "font-label-sm text-label-sm font-medium flex items-center gap-1 mt-0.5";
const BADGE_CLASSES =
  "px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-bold";

export default function PickupQueuePanel() {
  const { pickups } = classroomPanel;

  return (
    <PanelCard
      action={
        <Tag emphasis="strong" size="xs" tone="secondary" weight="bold">
          4 Turnos
        </Tag>
      }
      icon="verified"
      iconTone="secondary"
      subtitle="Próximas 2 horas"
      title="Próximas Recogidas"
    >
      <div className={LIST_CLASSES}>
        {pickups.map((turn) => (
          <div className={TURN_CLASSES} key={turn.id}>
            <div className={TIME_CLASSES}>
              <span className={TIME_LABEL_CLASSES}>HORA</span>
              <span
                className={`${TIME_VALUE_CLASSES} ${TEXT_TONE_CLASSES[turn.timeTone]}`}
              >
                {turn.time}
              </span>
            </div>
            <div className={BODY_CLASSES}>
              <div className={BODY_HEADER_CLASSES}>
                <span className={CHILD_NAME_CLASSES}>{turn.childName}</span>
                {turn.badge ? (
                  <span className={BADGE_CLASSES}>{turn.badge}</span>
                ) : (
                  <Icon className="text-primary" name="check_circle" size={16} />
                )}
              </div>
              <p className={COLLECTOR_CLASSES}>{turn.collector}</p>
              {turn.verification ? (
                <span
                  className={`${VERIFICATION_CLASSES} ${TEXT_TONE_CLASSES[turn.verification.tone]}`}
                >
                  <Icon name={turn.verification.icon} size={13} />
                  {turn.verification.text}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}
