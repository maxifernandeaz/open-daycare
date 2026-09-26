"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from "react";

type FallbackImageProps = {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  initials?: string;
  initialsClassName?: string;
};

function applyFallback(image: HTMLImageElement, fallbackSrc?: string) {
  if (fallbackSrc && !image.src.endsWith(fallbackSrc)) {
    image.src = fallbackSrc;
    return;
  }
  image.style.visibility = "hidden";
}

export default function FallbackImage({
  src,
  alt,
  className = "",
  fallbackSrc,
  initials,
  initialsClassName = "",
}: FallbackImageProps) {
  const imageRef = useRef<HTMLImageElement>(null);

  // SSR images start loading while parsing the HTML, so the error can fire
  // before React attaches its handlers. Re-check once mounted.
  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth === 0) {
      applyFallback(image, fallbackSrc);
    }
  }, [src, fallbackSrc]);

  return (
    <span className="relative inline-block align-middle">
      {initials ? (
        <span
          aria-hidden="true"
          className={`absolute inset-0 flex items-center justify-center ${initialsClassName}`}
        >
          {initials}
        </span>
      ) : null}
      <img
        ref={imageRef}
        alt={alt}
        className={`block ${initials ? "relative" : ""} ${className}`}
        onError={(event) => applyFallback(event.currentTarget, fallbackSrc)}
        src={src}
      />
    </span>
  );
}
