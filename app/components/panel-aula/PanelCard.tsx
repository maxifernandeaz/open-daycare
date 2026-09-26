import type { ReactNode } from "react";
import Icon from "@/app/components/Icons";
import { TONE_CONTAINER_CLASSES } from "./Tag";
import type { Tone } from "@/data/mock-classroom";

type PanelCardProps = {
  icon: string;
  iconTone: Tone;
  title: string;
  subtitle: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

export default function PanelCard({
  icon,
  iconTone,
  title,
  subtitle,
  action,
  className = "",
  children,
}: PanelCardProps) {
  return (
    <section
      className={`p-5 rounded-xl bg-surface-container-lowest shadow-sm space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${TONE_CONTAINER_CLASSES[iconTone]}`}
          >
            <Icon name={icon} size={18} />
          </div>
          <div className="flex flex-col">
            <h2 className="font-title-md text-title-md text-on-surface">{title}</h2>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {subtitle}
            </span>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
