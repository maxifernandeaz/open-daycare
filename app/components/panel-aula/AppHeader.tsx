import Icon from "@/app/components/Icons";
import FallbackImage from "./FallbackImage";
import { HEADER_HEIGHT_CLASS, SIDEBAR_LEFT_CLASS } from "./shell";
import { classroomShell } from "@/data/mock-classroom";

const SELECTOR_CLASSES =
  "flex items-center gap-2 bg-surface-container-low px-3.5 py-2 rounded-xl text-on-surface cursor-pointer hover:bg-surface-container transition-colors";

const ICON_BUTTON_CLASSES =
  "w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors";

export default function AppHeader() {
  const { header, user } = classroomShell;

  return (
    <header
      className={`fixed top-0 left-0 ${SIDEBAR_LEFT_CLASS} right-0 ${HEADER_HEIGHT_CLASS} bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_12px_rgba(0,0,0,0.03)] z-40 px-6`}
    >
      <div className="h-full w-full flex items-center justify-between gap-4 max-lg:overflow-x-auto max-lg:[&>*]:shrink-0">
        <div className="flex items-center gap-3">
          <div className={SELECTOR_CLASSES}>
            <Icon className="text-primary" name={header.classroomSelector.icon} size={20} />
            <div className="flex flex-col text-left">
              <span className="font-label-sm text-label-sm text-on-surface-variant leading-none">
                {header.classroomSelector.label}
              </span>
              <span className="font-title-md text-title-md text-on-surface">
                {header.classroomSelector.value}
              </span>
            </div>
            <Icon
              className="text-on-surface-variant"
              name={header.classroomSelector.toggleIcon}
              size={20}
            />
          </div>

          <div className={SELECTOR_CLASSES}>
            <Icon className="text-secondary" name={header.dateSelector.icon} size={20} />
            <div className="flex flex-col text-left">
              <span className="font-label-sm text-label-sm text-on-surface-variant leading-none">
                {header.dateSelector.label}
              </span>
              <span className="font-label-lg text-label-lg text-on-surface">
                {header.dateSelector.value}
              </span>
            </div>
            <Icon
              className="text-on-surface-variant"
              name={header.dateSelector.toggleIcon}
              size={18}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg shadow-[0_4px_14px_rgba(16,185,129,0.25)] hover:bg-primary transition-all"
            type="button"
          >
            <Icon name={header.primaryAction.icon} size={20} />
            <span>{header.primaryAction.label}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              aria-label={header.notifications.label}
              className={`${ICON_BUTTON_CLASSES} relative`}
              type="button"
            >
              <Icon name={header.notifications.icon} size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error" />
            </button>
            <button
              aria-label={header.messages.label}
              className={ICON_BUTTON_CLASSES}
              type="button"
            >
              <Icon name={header.messages.icon} size={20} />
            </button>
          </div>

          <div className="h-8 w-[1px] bg-surface-container-high" />

          <div className="flex items-center gap-3 pl-1">
            <div className="relative">
              <FallbackImage
                alt={user.alt}
                className="w-10 h-10 rounded-full object-cover"
                initials={user.initials}
                initialsClassName="rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold"
                src={user.photo}
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-primary-container border-2 border-surface-container-lowest" />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <span className="font-title-md text-title-md text-on-surface">
                  {user.name}
                </span>
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {user.shiftLabel}
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
