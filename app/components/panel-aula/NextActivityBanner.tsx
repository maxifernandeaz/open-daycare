import Icon from "@/app/components/Icons";
import { classroomPanel } from "@/data/mock-classroom";

const BANNER_CLASSES =
  "p-4 rounded-xl bg-surface-container-high/60 flex items-center justify-between gap-4";
const CONTENT_CLASSES = "flex items-center gap-3";
const ICON_WRAPPER_CLASSES = "p-2 rounded-lg bg-primary text-on-primary";
const TEXT_WRAPPER_CLASSES = "flex flex-col";
const TITLE_CLASSES = "font-title-md text-title-md text-on-surface";
const DESCRIPTION_CLASSES = "font-body-sm text-body-sm text-on-surface-variant";
const ACTION_CLASSES =
  "px-3 py-1.5 rounded-lg bg-surface-container-lowest shadow-sm font-label-sm text-label-sm text-on-surface font-semibold hover:bg-surface transition-colors whitespace-nowrap";

export default function NextActivityBanner() {
  const { nextActivity } = classroomPanel;

  return (
    <div className={BANNER_CLASSES}>
      <div className={CONTENT_CLASSES}>
        <div className={ICON_WRAPPER_CLASSES}>
          <Icon name="music_note" size={20} />
        </div>
        <div className={TEXT_WRAPPER_CLASSES}>
          <span className={TITLE_CLASSES}>
            {nextActivity.title} ({nextActivity.time})
          </span>
          <span className={DESCRIPTION_CLASSES}>
            {nextActivity.description}
          </span>
        </div>
      </div>
      <button className={ACTION_CLASSES} type="button">
        {nextActivity.actionLabel}
      </button>
    </div>
  );
}
