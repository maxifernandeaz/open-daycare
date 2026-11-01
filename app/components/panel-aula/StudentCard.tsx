import Icon from "@/app/components/Icons";
import type { RosterStudent } from "@/app/panel-aula/queries";
import Tag from "./Tag";

const CARD_CLASSES =
  "rounded-xl bg-surface-container-lowest p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4";

const AVATAR_CLASSES =
  "flex items-center justify-center w-12 h-12 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm font-bold shrink-0";

const NAME_CLASSES = "font-title-md text-title-md text-on-surface";
const META_CLASSES = "font-body-sm text-body-sm text-on-surface-variant";
const INFO_GRID_CLASSES =
  "grid grid-cols-1 sm:grid-cols-2 gap-2 bg-surface-container-low p-2.5 rounded-xl font-body-sm text-body-sm";
const INFO_LABEL_CLASSES =
  "font-label-sm text-label-sm text-on-surface-variant leading-tight";
const INFO_VALUE_CLASSES = "text-on-surface font-medium truncate";

type StudentCardProps = {
  student: RosterStudent;
};

export default function StudentCard({ student }: StudentCardProps) {
  return (
    <article className={CARD_CLASSES}>
      <div className="flex items-start gap-3">
        <div aria-hidden="true" className={AVATAR_CLASSES}>
          {student.initials}
        </div>
        <div className="flex flex-col min-w-0">
          <span className={`${NAME_CLASSES} truncate`}>{student.name}</span>
          <span className={META_CLASSES}>
            {student.ageLabel} · {student.classroomName}
          </span>
        </div>
      </div>

      {student.healthTag ? (
        <Tag
          className={student.healthTag.tone === "error" ? "shadow-sm self-start" : "self-start"}
          icon={student.healthTag.icon}
          iconSize={15}
          shape="soft"
          size="md"
          tone={student.healthTag.tone}
          weight="bold"
        >
          {student.healthTag.text}
        </Tag>
      ) : null}

      <div className={INFO_GRID_CLASSES}>
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="text-primary" name="person" size={18} />
          <div className="flex flex-col min-w-0">
            <span className={INFO_LABEL_CLASSES}>Educadora</span>
            <span className={INFO_VALUE_CLASSES}>
              {student.educatorName ?? "Sin educadora"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="text-secondary" name="schedule" size={18} />
          <div className="flex flex-col min-w-0">
            <span className={INFO_LABEL_CLASSES}>Horario</span>
            <span className={INFO_VALUE_CLASSES}>{student.scheduleLabel}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
