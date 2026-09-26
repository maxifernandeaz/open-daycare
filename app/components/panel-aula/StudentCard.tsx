import Icon from "@/app/components/Icons";
import FallbackImage from "./FallbackImage";
import Tag from "./Tag";
import type { Student, Tone } from "@/data/mock-classroom";

const ACCENT_TONE_CLASSES: Record<Tone, string> = {
  primary: "bg-primary-container",
  secondary: "bg-secondary-container",
  tertiary: "bg-tertiary-container",
  error: "bg-error",
  surface: "bg-surface-container-highest",
  outline: "bg-outline-variant",
};

const DOT_TONE_CLASSES: Record<Tone, string> = {
  primary: "bg-primary-container",
  secondary: "bg-secondary-container",
  tertiary: "bg-tertiary-container",
  error: "bg-error",
  surface: "bg-surface-container-highest",
  outline: "bg-outline",
};

const INDICATOR_TONE_CLASSES: Record<Tone, string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  tertiary: "text-tertiary",
  error: "text-error",
  surface: "text-on-surface",
  outline: "text-on-surface-variant",
};

const CARD_PRESENT_CLASSES =
  "rounded-xl bg-surface-container-lowest p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group";

const CARD_ABSENT_CLASSES =
  "rounded-xl bg-surface-container-low/60 p-5 shadow-sm flex flex-col justify-between relative overflow-hidden opacity-80 hover:opacity-100 transition-all";

const ACCENT_BAR_CLASSES = "absolute top-0 left-0 w-1.5 h-full";

const PHOTO_CLASSES = "w-12 h-12 rounded-full object-cover";
const PHOTO_ABSENT_CLASSES = "w-12 h-12 rounded-full object-cover grayscale";
const PRESENCE_DOT_CLASSES =
  "absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-surface-container-lowest";
const PHOTO_INITIALS_CLASSES =
  "flex items-center justify-center font-label-sm text-label-sm font-bold text-on-surface-variant";

const FOOTER_CLASSES = "mt-4 pt-3 flex items-center justify-between";
const FOOTNOTE_CLASSES = "font-label-sm text-label-sm";
const ACTION_GROUP_CLASSES = "flex items-center gap-1.5";
const ADD_EVENT_CLASSES =
  "p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors";
const PRIMARY_ACTION_CLASSES =
  "px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-bold shadow-sm hover:bg-primary transition-colors";
const SECONDARY_ACTION_CLASSES =
  "px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold transition-colors";

const INDICATOR_GRID_CLASSES =
  "mt-4 grid grid-cols-2 gap-2 bg-surface-container-low p-2.5 rounded-xl font-body-sm text-body-sm";

const NOTE_CLASSES =
  "mt-4 font-body-sm text-body-sm text-on-surface-variant italic bg-surface-container-lowest/60 p-2.5 rounded-xl";

type StudentCardProps = {
  student: Student;
};

export default function StudentCard({ student }: StudentCardProps) {
  const isAbsent = Boolean(student.grayscale);
  const indicators = student.indicators ?? [];

  return (
    <article className={isAbsent ? CARD_ABSENT_CLASSES : CARD_PRESENT_CLASSES}>
      <div className={ACCENT_BAR_CLASSES + " " + ACCENT_TONE_CLASSES[student.accentTone]} />

      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <FallbackImage
                alt={student.photoAlt}
                className={isAbsent ? PHOTO_ABSENT_CLASSES : PHOTO_CLASSES}
                fallbackSrc={student.fallbackPhoto}
                initials={student.initials}
                initialsClassName={PHOTO_INITIALS_CLASSES}
                src={student.photo}
              />
              <span
                className={`${PRESENCE_DOT_CLASSES} ${DOT_TONE_CLASSES[student.presenceDotTone]}`}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-title-md text-title-md text-on-surface">{student.name}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {student.age} · {student.tutorLabel}
              </span>
            </div>
          </div>

          <Tag
            icon={student.statusIcon}
            iconSize={14}
            size={isAbsent ? "md" : "sm"}
            tone={student.statusTone}
            weight={isAbsent ? "bold" : "semibold"}
            emphasis={isAbsent ? "strong" : "soft"}
          >
            {student.statusLabel}
          </Tag>
        </div>

        {student.healthTag ? (
          <div className="mt-3">
            <Tag
              className={student.healthTag.tone === "error" ? "shadow-sm" : ""}
              icon={student.healthTag.icon}
              iconSize={15}
              shape="soft"
              size="md"
              tone={student.healthTag.tone}
              weight="bold"
            >
              {student.healthTag.text}
            </Tag>
          </div>
        ) : null}

        {indicators.length > 0 ? (
          <div className={INDICATOR_GRID_CLASSES}>
            {indicators.map((indicator) => (
              <div className="flex items-center gap-2" key={indicator.label}>
                <Icon
                  className={INDICATOR_TONE_CLASSES[indicator.iconTone]}
                  name={indicator.icon}
                  size={18}
                />
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight">
                    {indicator.label}
                  </span>
                  <span className="text-on-surface truncate font-medium">{indicator.value}</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {student.note ? <p className={NOTE_CLASSES}>{student.note}</p> : null}
      </div>

      <div className={FOOTER_CLASSES}>
        <span className={`${FOOTNOTE_CLASSES} ${INDICATOR_TONE_CLASSES[student.footnote.tone]}`}>
          {student.footnoteLabel}: {student.footnote.text}
        </span>
        <div className={ACTION_GROUP_CLASSES}>
          {student.showAddEvent ? (
            <button className={ADD_EVENT_CLASSES} title="Añadir evento" type="button">
              <Icon name="post_add" size={18} />
            </button>
          ) : null}
          <button className={isAbsent ? SECONDARY_ACTION_CLASSES : PRIMARY_ACTION_CLASSES} type="button">
            {student.primaryAction}
          </button>
        </div>
      </div>
    </article>
  );
}
