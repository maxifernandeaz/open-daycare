"use client";

/* eslint-disable @next/next/no-img-element */

type FallbackImageProps = {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  initials?: string;
  initialsClassName?: string;
};

export default function FallbackImage({
  src,
  alt,
  className = "",
  fallbackSrc,
  initials,
  initialsClassName = "",
}: FallbackImageProps) {
  return (
    <>
      {initials ? (
        <span
          aria-hidden="true"
          className={`absolute inset-0 flex items-center justify-center ${initialsClassName}`}
        >
          {initials}
        </span>
      ) : null}
      <img
        alt={alt}
        className={`${initials ? "relative" : ""} ${className}`}
        onError={(event) => {
          const image = event.currentTarget;
          if (fallbackSrc && !image.src.endsWith(fallbackSrc)) {
            image.src = fallbackSrc;
            return;
          }
          image.style.visibility = "hidden";
        }}
        src={src}
      />
    </>
  );
}
