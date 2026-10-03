import type { ReactNode } from "react";
import Icon from "@/app/components/Icons";

type FormSectionProps = {
  title: string;
  subtitle?: string;
  subtitleClassName?: string;
  number?: string;
  icon?: { name: string; className: string };
  badge?: { label: string; className: string };
  trailing?: ReactNode;
  compact?: boolean;
  className?: string;
  children: ReactNode;
};

const CARD_CLASSES = "rounded-3xl shadow-sm transition-all duration-300";

export default function FormSection({
  title,
  subtitle,
  subtitleClassName = "font-body-sm text-body-sm text-on-surface-variant",
  number,
  icon,
  badge,
  trailing,
  compact = false,
  className = "bg-surface-container-lowest",
  children,
}: FormSectionProps) {
  const padding = compact ? "p-6 sm:p-7" : "p-6 sm:p-8";

  const headerClassName = icon
    ? "flex items-start justify-between gap-3 pb-5"
    : badge
      ? "flex items-center justify-between pb-6"
      : "flex items-center gap-3 pb-5";

  const markerClassName = icon
    ? `w-9 h-9 rounded-xl ${icon.className} flex items-center justify-center shadow-md`
    : "w-8 h-8 rounded-xl bg-surface-container-low text-primary flex items-center justify-center font-bold text-label-md";

  const titleGap = icon ? "flex items-center gap-2.5" : "flex items-center gap-3";

  return (
    <section className={`${CARD_CLASSES} ${padding} ${className}`}>
      <div className={headerClassName}>
        <div className={titleGap}>
          <span className={markerClassName}>
            {icon ? <Icon name={icon.name} size={20} /> : number}
          </span>
          <div>
            <h2 className="font-title-md text-title-md text-on-surface">{title}</h2>
            {subtitle ? (
              <p className={subtitleClassName}>{subtitle}</p>
            ) : null}
          </div>
        </div>
        {badge ? (
          <span className={badge.className}>{badge.label}</span>
        ) : (
          trailing
        )}
      </div>
      {children}
    </section>
  );
}
