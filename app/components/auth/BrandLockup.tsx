/* eslint-disable @next/next/no-img-element */

import type { BrandRef } from "@/data/mock-auth";

const BASE_CLASSES = "inline-flex items-center";
const HERO_CHIP_CLASSES = "rounded-2xl bg-white/90 p-2.5 shadow-sm";
const HERO_LOGO_CLASSES = "h-7 w-auto object-contain";
const LIGHT_LOGO_CLASSES = "h-10 w-auto object-contain md:h-12";

const BRAND_LOCKUP_VARIANTS = {
  hero: "hero",
  light: "light",
} as const;

type BrandLockupVariant =
  (typeof BRAND_LOCKUP_VARIANTS)[keyof typeof BRAND_LOCKUP_VARIANTS];

type BrandLockupProps = {
  brand: BrandRef;
  variant: BrandLockupVariant;
  className?: string;
};

export default function BrandLockup({
  brand,
  variant,
  className = "",
}: BrandLockupProps) {
  const isHero = variant === BRAND_LOCKUP_VARIANTS.hero;
  const wrapperClasses = [
    BASE_CLASSES,
    isHero ? HERO_CHIP_CLASSES : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={wrapperClasses}>
      <img
        alt={brand.logoAlt}
        className={isHero ? HERO_LOGO_CLASSES : LIGHT_LOGO_CLASSES}
        decoding="async"
        src={brand.logoSrc}
      />
    </span>
  );
}
