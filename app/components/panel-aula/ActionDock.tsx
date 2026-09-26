import Icon from "@/app/components/Icons";
import { classroomPanel } from "@/data/mock-classroom";
import type { Tone } from "@/data/mock-classroom";

const ICON_TONE_CLASSES: Record<Tone, string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  tertiary: "text-tertiary",
  error: "text-error",
  surface: "text-on-surface",
  outline: "text-on-surface-variant",
};

const DOCK_CLASSES =
  "p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4";

const QUICK_ACTION_CLASSES =
  "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors active:scale-95";

const FILTER_TRACK_CLASSES =
  "flex items-center gap-1.5 bg-surface-container-low p-1.5 rounded-xl self-start lg:self-auto overflow-x-auto max-w-full";

const FILTER_ACTIVE_CLASSES =
  "px-3 py-1.5 rounded-lg bg-surface-container-lowest shadow-sm font-label-sm text-label-sm text-on-surface font-bold whitespace-nowrap";

const FILTER_IDLE_CLASSES =
  "px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm font-semibold whitespace-nowrap transition-colors";

export default function ActionDock() {
  return (
    <section className={DOCK_CLASSES}>
      <div className="flex items-center flex-wrap gap-2">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-bold mr-1">
          Registros rápidos:
        </span>
        {classroomPanel.quickActions.map((action) => (
          <button className={QUICK_ACTION_CLASSES} key={action.label} type="button">
            <Icon
              className={ICON_TONE_CLASSES[action.iconTone]}
              name={action.icon}
              size={18}
            />
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      <div className={FILTER_TRACK_CLASSES}>
        {classroomPanel.statusFilters.map((filter) => (
          <button
            className={filter.active ? FILTER_ACTIVE_CLASSES : FILTER_IDLE_CLASSES}
            key={filter.label}
            type="button"
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>
    </section>
  );
}
