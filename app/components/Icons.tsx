type IconProps = {
  name: string;
  size?: number;
  fill?: boolean;
  className?: string;
};

export default function Icon({
  name,
  size = 20,
  fill = false,
  className = "",
}: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: fill ? "'FILL' 1" : undefined,
      }}
    >
      {name}
    </span>
  );
}