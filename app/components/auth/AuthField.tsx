import type { AuthFieldData } from "@/data/mock-auth";

const LABEL_CLASSES =
  "mb-2 block font-label-sm text-label-sm text-on-surface-variant uppercase";

const INPUT_CLASSES =
  "w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3.5 text-body-md text-on-surface shadow-sm transition-colors placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 read-only:cursor-default read-only:select-none read-only:border-outline read-only:shadow-none read-only:focus:border-outline read-only:focus:ring-0";

const SPACED_CLASSES = "font-title-md text-title-md font-semibold tracking-widest";

type AuthFieldProps = {
  field: AuthFieldData;
};

export default function AuthField({ field }: AuthFieldProps) {
  return (
    <div>
      <label className={LABEL_CLASSES} htmlFor={field.id}>
        {field.label}
      </label>
      <input
        autoComplete={field.autoComplete}
        className={`${INPUT_CLASSES} ${field.spaced ? SPACED_CLASSES : ""}`}
        defaultValue={field.defaultValue}
        id={field.id}
        name={field.name}
        placeholder={field.placeholder}
        readOnly={field.readOnly}
        type={field.type}
      />
    </div>
  );
}
