import Icon from "@/app/components/Icons";
import FallbackImage from "./FallbackImage";
import type { Educator } from "@/data/mock-classroom";
import { classroomPanel } from "@/data/mock-classroom";

const LIVE_PILL_CLASSES =
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm";

const EDUCATOR_INITIALS_CLASSES =
  "w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-sm text-label-sm font-bold";

const HERO_ACTION_CLASSES =
  "inline-flex items-center gap-2 bg-primary-container text-on-primary px-4 py-2.5 rounded-xl font-label-lg text-label-lg shadow-sm hover:bg-primary transition-all active:scale-95";

export default function OpsHero() {
  const { liveLabel, shiftLabel, title, subtitle, educators, action } =
    classroomPanel.hero;
  const people: Educator[] = educators.people;

  return (
    <section className="relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm p-6">
      <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-primary-fixed/20 blur-2xl pointer-events-none" />
      <div className="absolute right-48 -top-8 w-40 h-40 rounded-full bg-secondary-fixed/30 blur-xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={LIVE_PILL_CLASSES}>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              {liveLabel}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              {shiftLabel}
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            {title}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2.5 rounded-xl shadow-inner">
            <div className="flex -space-x-2">
              {people.map((person) => (
                <div className="relative" key={person.name}>
                  {person.photo ? (
                    <FallbackImage
                      alt={person.alt ?? person.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-surface-container-lowest"
                      initials={person.initials}
                      initialsClassName={EDUCATOR_INITIALS_CLASSES}
                      src={person.photo}
                    />
                  ) : (
                    <div className={EDUCATOR_INITIALS_CLASSES}>
                      {person.initials}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                {educators.label}
              </span>
              <span className="font-label-md text-label-md text-on-surface">
                {educators.summary}
              </span>
            </div>
          </div>

          <button className={HERO_ACTION_CLASSES} type="button">
            <Icon name={action.icon} size={20} />
            <span>{action.label}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
