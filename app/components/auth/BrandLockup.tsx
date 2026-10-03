/* eslint-disable @next/next/no-img-element */

import type { BrandRef } from "@/data/mock-auth";

const HERO_CHIP_CLASSES =
  "inline-flex items-center rounded-2xl bg-white/90 p-2.5 shadow-sm";
const HERO_LOGO_CLASSES = "h-7 w-auto object-contain";
const LIGHT_LOGO_CLASSES = "h-10 w-auto object-contain md:h-12";

type BrandLockupProps = {
  brand: BrandRef;
  variant: "hero" | "light";
  className?: string;
};

export default function BrandLockup({
  brand,
  variant,
  className = "",
}: BrandLockupProps) {
  const isHero = variant === "hero";

  return (
    <span
      className={`inline-flex items-center ${isHero ? HERO_CHIP_CLASSES : ""} ${className}`}
    >
      <img
        alt={brand.logoAlt}
        className={isHero ? HERO_LOGO_CLASSES : LIGHT_LOGO_CLASSES}
        src={brand.logoSrc}
      />
    </span>
  );
}
