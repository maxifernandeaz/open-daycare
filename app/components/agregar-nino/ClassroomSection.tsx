import Icon from "@/app/components/Icons";
import { enrollmentScreen } from "@/data/mock-enrollment";
import type { ClassroomCard } from "@/data/mock-enrollment";
import FormSection from "./FormSection";

const SELECT_CLASSES =
  "w-full pl-11 pr-8 py-3 bg-surface-container-lowest rounded-xl font-body-md text-body-md text-on-surface focus:outline-none shadow-sm cursor-pointer appearance-none";

function vacancyDotClass(room: ClassroomCard) {
  if (room.recommended) return "w-2 h-2 rounded-full bg-primary animate-pulse";
  return room.vacancy.tone === "tertiary"
    ? "w-2 h-2 rounded-full bg-tertiary-container"
    : "w-2 h-2 rounded-full bg-primary-container";
}

function vacancyTextClass(room: ClassroomCard) {
  return room.recommended
    ? "text-primary font-label-sm text-label-sm font-bold"
    : "text-on-surface-variant font-label-sm text-label-sm";
}

function ClassroomCardTile({ room }: { room: ClassroomCard }) {
  const recommended = Boolean(room.recommended);
  const surfaceClass = recommended
    ? "bg-primary-fixed/20 peer-checked:bg-primary-fixed/40"
    : "bg-surface-container-low peer-checked:bg-secondary-fixed/50";
  const iconClass = recommended
    ? "bg-primary-container text-on-primary shadow-sm"
    : "bg-surface-container-highest text-secondary";
  const titleClass = recommended ? "text-primary font-bold" : "text-on-surface";
  const taglineClass = recommended ? "text-primary font-semibold" : "text-secondary";

  return (
    <label className="cursor-pointer group relative">
      <input
        className="peer sr-only"
        defaultChecked={recommended}
        name="classroom_choice"
        type="radio"
        value={room.id}
      />
      <div
        className={`p-4 rounded-2xl ${surfaceClass} transition-all flex flex-col h-full shadow-sm hover:shadow-md`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className={`w-8 h-8 rounded-lg ${iconClass} flex items-center justify-center`}>
            <Icon name={room.icon} size={20} />
          </div>
          {recommended ? (
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-primary text-on-primary font-bold">
              Edad Recomendada
            </span>
          ) : (
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {room.range}
            </span>
          )}
        </div>
        <h3 className={`font-title-md text-title-md ${titleClass}`}>{room.name}</h3>
        <span className={`font-label-sm text-label-sm ${taglineClass}`}>{room.tagline}</span>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 mb-3">
          {room.description}
        </p>
        <div
          className={`mt-auto pt-2 flex items-center gap-1.5 ${vacancyTextClass(room)}`}
        >
          <span className={vacancyDotClass(room)} />
          <span>{room.vacancy.text}</span>
        </div>
      </div>
    </label>
  );
}

export default function ClassroomSection() {
  const { classroomSection, classrooms, teachers, schedules, defaults } =
    enrollmentScreen;

  return (
    <FormSection
      badge={{
        label: classroomSection.badge,
        className:
          "font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold",
      }}
      number={classroomSection.number}
      subtitle={classroomSection.subtitle}
      title={classroomSection.title}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {classrooms.map((room) => (
          <ClassroomCardTile key={room.id} room={room} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 rounded-2xl bg-surface">
        <div>
          <label
            className="block font-label-lg text-label-lg text-on-surface mb-2"
            htmlFor="assigned-teacher"
          >
            {classroomSection.teacherLabel}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-primary">
              <Icon name="school" size={20} />
            </div>
            <select
              className={SELECT_CLASSES}
              defaultValue={defaults.teacher}
              id="assigned-teacher"
            >
              {teachers.map((teacher) => (
                <option key={teacher.value} value={teacher.value}>
                  {teacher.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-on-surface-variant">
              <Icon name="expand_more" size={18} />
            </div>
          </div>
        </div>

        <div>
          <label
            className="block font-label-lg text-label-lg text-on-surface mb-2"
            htmlFor="stay-schedule"
          >
            {classroomSection.scheduleLabel}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
              <Icon name="nest_clock_farsight_analog" size={20} />
            </div>
            <select
              className={SELECT_CLASSES}
              defaultValue={defaults.schedule}
              id="stay-schedule"
            >
              {schedules.map((schedule) => (
                <option key={schedule.value} value={schedule.value}>
                  {schedule.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-on-surface-variant">
              <Icon name="expand_more" size={18} />
            </div>
          </div>
        </div>
      </div>
    </FormSection>
  );
}
