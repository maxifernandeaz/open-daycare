import type { ReactNode } from "react";
import Icon from "@/app/components/Icons";
import type { Tone } from "@/data/mock-classroom";

export const TONE_CONTAINER_CLASSES: Record<Tone, string> = {
  primary: "bg-primary-fixed text-on-primary-fixed",
  secondary: "bg-secondary-fixed text-on-secondary-fixed",
  tertiary: "bg-tertiary-fixed text-on-tertiary-fixed",
  error: "bg-error-container text-on-error-container",
  surface: "bg-surface-container text-on-surface",
  outline: "bg-surface-container-low text-on-surface-variant",
};

export const TONE_STRONG_CLASSES: Record<Tone, string> = {
  primary: "bg-primary-container text-on-primary",
  secondary: "bg-secondary-container text-on-secondary-container",
  tertiary: "bg-tertiary-container text-on-tertiary-container",
  error: "bg-error text-on-error",
  surface: "bg-surface-container-highest text-on-surface-variant",
  outline: "bg-surface-container-high text-on-surface",
};

const SHAPE_CLASSES = {
  pill: "rounded-full",
  soft: "rounded-lg",
} as const;

const SIZE_CLASSES = {
  xs: "px-2 py-0.5",
  sm: "px-2 py-1",
  md: "px-2.5 py-1",
} as const;

const WEIGHT_CLASSES = {
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
} as const;

type TagProps = {
  tone: Tone;
  children: ReactNode;
  icon?: string;
  iconSize?: number;
  dot?: "solid" | "ping";
  shape?: keyof typeof SHAPE_CLASSES;
  size?: keyof typeof SIZE_CLASSES;
  weight?: keyof typeof WEIGHT_CLASSES;
  emphasis?: "soft" | "strong";
  className?: string;
};

export default function Tag({
  tone,
  children,
  icon,
  iconSize = 15,
  dot,
  shape = "pill",
  size = "sm",
  weight = "semibold",
  emphasis = "soft",
  className = "",
}: TagProps) {
  const toneClasses =
    emphasis === "strong" ? TONE_STRONG_CLASSES[tone] : TONE_CONTAINER_CLASSES[tone];

  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap font-label-sm text-label-sm ${SHAPE_CLASSES[shape]} ${SIZE_CLASSES[size]} ${WEIGHT_CLASSES[weight]} ${toneClasses} ${className}`}
    >
      {dot ? (
        <span
          className={`w-1.5 h-1.5 rounded-full bg-primary ${
            dot === "ping" ? "animate-ping" : ""
          }`}
        />
      ) : null}
      {icon ? <Icon name={icon} size={iconSize} /> : null}
      {children}
    </span>
  );
}
