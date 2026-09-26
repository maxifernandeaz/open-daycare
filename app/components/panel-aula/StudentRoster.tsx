import Icon from "@/app/components/Icons";
import StudentCard from "./StudentCard";
import { classroomPanel } from "@/data/mock-classroom";

const HEADER_CLASSES = "flex flex-wrap items-center justify-between gap-2 px-1";
const TITLE_CLASSES = "font-headline-sm text-headline-sm text-on-surface";
const TOTAL_PILL_CLASSES =
  "px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm font-bold";
const SEARCH_WRAPPER_CLASSES = "relative";
const SEARCH_ICON_CLASSES = "absolute left-3 top-2.5 text-[18px] text-outline";
const SEARCH_INPUT_CLASSES =
  "w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-container-lowest text-on-surface font-body-sm text-body-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container";
const GRID_CLASSES = "grid grid-cols-1 md:grid-cols-2 gap-4";

export default function StudentRoster() {
  const { roster } = classroomPanel;

  return (
    <section className="space-y-4">
      <div className={HEADER_CLASSES}>
        <div className="flex items-center gap-2">
          <span className={TITLE_CLASSES}>{roster.title}</span>
          <span className={TOTAL_PILL_CLASSES}>{roster.totalLabel}</span>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <div className={`${SEARCH_WRAPPER_CLASSES} min-w-0 flex-1 sm:flex-none`}>
            <Icon className={SEARCH_ICON_CLASSES} name="search" size={18} />
            <input
              className={SEARCH_INPUT_CLASSES}
              placeholder={roster.searchPlaceholder}
              type="text"
            />
          </div>
        </div>
      </div>

      <div className={GRID_CLASSES}>
        {classroomPanel.students.map((student) => (
          <StudentCard key={student.id} student={student} />
        ))}
      </div>
    </section>
  );
}
