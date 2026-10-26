"use client";

import { useFormStatus } from "react-dom";
import Icon from "@/app/components/Icons";

type SubmitButtonProps = {
  label: string;
  pendingLabel: string;
  icon: string;
  iconSize?: number;
  className: string;
};

export default function SubmitButton({
  label,
  pendingLabel,
  icon,
  iconSize = 20,
  className,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`${className} disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:shadow-md disabled:hover:translate-y-0`}
      disabled={pending}
      form="childEnrollmentForm"
      type="submit"
    >
      <Icon
        className={pending ? "animate-spin" : undefined}
        name={pending ? "progress_activity" : icon}
        size={iconSize}
      />
      <span>{pending ? pendingLabel : label}</span>
    </button>
  );
}
