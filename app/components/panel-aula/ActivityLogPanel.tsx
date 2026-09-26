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

const TIMELINE_CLASSES = "relative pl-6 space-y-4";
const TIMELINE_LINE_CLASSES =
  "absolute left-2.5 top-2 bottom-2 w-0.5 bg-surface-container-highest";
const ENTRY_CLASSES = "relative flex flex-col gap-1";
const ENTRY_DOT_CLASSES =
  "absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-surface-container-lowest";
const ENTRY_HEADER_CLASSES = "flex items-baseline justify-between";
const AUTHOR_CLASSES = "font-label-md text-label-md text-on-surface font-bold";
const TIME_AGO_CLASSES = "font-label-sm text-label-sm text-on-surface-variant";
const ENTRY_TEXT_CLASSES = "font-body-sm text-body-sm text-on-surface-variant";
const VIEW_ALL_CLASSES =
  "font-label-sm text-label-sm text-primary font-bold hover:underline";

export default function ActivityLogPanel() {
  const { logEntries } = classroomPanel;

  return (
    <PanelCard
      action={
        <button className={VIEW_ALL_CLASSES} type="button">
          Ver todo
        </button>
      }
      icon="history"
      iconClassName="bg-surface-container-highest text-on-surface"
      subtitle="Últimos registros del aula"
      title="Bitácora en Directo"
    >
      <div className={TIMELINE_CLASSES}>
        <div className={TIMELINE_LINE_CLASSES} />
        {logEntries.map((entry) => (
          <div className={ENTRY_CLASSES} key={entry.id}>
            <span
              className={`${ENTRY_DOT_CLASSES} ${DOT_TONE_CLASSES[entry.dotTone]}`}
            />
            <div className={ENTRY_HEADER_CLASSES}>
              <span className={AUTHOR_CLASSES}>{entry.author}</span>
              <span className={TIME_AGO_CLASSES}>{entry.timeAgo}</span>
            </div>
            <p className={ENTRY_TEXT_CLASSES}>{entry.text}</p>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}
