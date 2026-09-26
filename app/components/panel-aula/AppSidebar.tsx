import Icon from "@/app/components/Icons";
import FallbackImage from "./FallbackImage";
import { SIDEBAR_WIDTH_CLASS } from "./shell";
import { classroomShell } from "@/data/mock-classroom";

const ACTIVE_NAV_ITEM_CLASSES =
  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-primary-container text-on-primary font-bold shadow-[0_4px_12px_rgba(16,185,129,0.25)]";

const NAV_ITEM_CLASSES =
  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors";

export default function AppSidebar() {
  const { brand, center, navItems, support } = classroomShell;

  return (
    <aside
      className={`fixed left-0 top-0 h-full ${SIDEBAR_WIDTH_CLASS} bg-surface-container-lowest z-50 hidden lg:flex flex-col justify-between shadow-[0_1px_16px_rgba(0,0,0,0.04)]`}
    >
      <div className="flex flex-col flex-1 min-h-0">
        <div className="h-20 flex items-center gap-3 px-6">
          <FallbackImage
            alt={brand.logoAlt}
            className="h-8 w-8 rounded-lg object-contain"
            initials={brand.initials}
            initialsClassName="rounded-lg bg-primary-container text-on-primary font-headline-sm text-headline-sm font-bold"
            src={brand.logo}
          />
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-primary tracking-tight">
              {brand.name}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {brand.tagline}
            </span>
          </div>
        </div>

        <div className="px-4 py-2">
          <div className="bg-surface-container-low rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-pulse" />
              <span className="font-label-md text-label-md text-on-surface">
                {center.name}
              </span>
            </div>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-semibold">
              {center.statusLabel}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <a
              className={item.active ? ACTIVE_NAV_ITEM_CLASSES : NAV_ITEM_CLASSES}
              href="#"
              key={item.path}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>

      <div className="p-4 m-4 bg-surface-container-low rounded-xl flex items-center gap-3">
        <div className="p-2 bg-secondary-fixed rounded-lg text-on-secondary-fixed">
          <Icon name={support.icon} size={22} />
        </div>
        <div className="flex flex-col">
          <span className="font-label-md text-label-md text-on-surface">
            {support.title}
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            {support.availability}
          </span>
        </div>
      </div>
    </aside>
  );
}
