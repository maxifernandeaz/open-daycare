import Icon from "@/app/components/Icons";
import PanelCard from "./PanelCard";
import { classroomPanel } from "@/data/mock-classroom";
import type { Tone } from "@/data/mock-classroom";

const DOT_TONE_CLASSES: Record<Tone, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  tertiary: "bg-tertiary",
  error: "bg-error",
  surface: "bg-surface",
  outline: "bg-outline",
};

const TEXT_TONE_CLASSES: Record<Tone, string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  tertiary: "text-tertiary",
  error: "text-error",
  surface: "text-on-surface",
  outline: "text-on-surface-variant",
};

const LIST_CLASSES = "space-y-2.5";
const ALERT_CLASSES = "p-3 rounded-xl bg-surface-container-low flex flex-col gap-1.5";
const ALERT_HEADER_CLASSES = "flex items-center justify-between";
const ALERT_IDENTITY_CLASSES = "flex items-center gap-2";
const DOT_CLASSES = "w-2 h-2 rounded-full";
const CHILD_NAME_CLASSES = "font-label-md text-label-md text-on-surface font-bold";
const TAG_LABEL_CLASSES = "font-label-sm text-label-sm font-bold";
const DESCRIPTION_CLASSES = "font-body-sm text-body-sm text-on-surface-variant";
const INFO_ICON_CLASSES = "text-outline cursor-pointer hover:text-on-surface";

export default function HealthProtocolsPanel() {
  const { protocols } = classroomPanel;

  return (
    <PanelCard
      action={<Icon className={INFO_ICON_CLASSES} name="info" size={24} />}
      icon="emergency"
      iconTone="error"
      subtitle="4 alertas en seguimiento"
      title="Protocolos & Medicación"
    >
      <div className={LIST_CLASSES}>
        {protocols.map((protocol) => (
          <div className={ALERT_CLASSES} key={protocol.id}>
            <div className={ALERT_HEADER_CLASSES}>
              <div className={ALERT_IDENTITY_CLASSES}>
                <span
                  className={`${DOT_CLASSES} ${DOT_TONE_CLASSES[protocol.dotTone]}`}
                />
                <span className={CHILD_NAME_CLASSES}>{protocol.childName}</span>
              </div>
              <span
                className={`${TAG_LABEL_CLASSES} ${TEXT_TONE_CLASSES[protocol.tagTone]}`}
              >
                {protocol.tag}
              </span>
            </div>
            <p className={DESCRIPTION_CLASSES}>{protocol.description}</p>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}
