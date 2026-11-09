"use client";

import { useFormStatus } from "react-dom";
import Icon from "@/app/components/Icons";
import { signOut } from "@/app/auth/actions";

const LOGOUT_LABEL = "Cerrar sesión";
const LOGOUT_ICON = "logout";
const ICON_VARIANT_ICON_SIZE = 20;
const LINK_VARIANT_ICON_SIZE = 18;

const ICON_CLASSES =
  "w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const LINK_CLASSES =
  "inline-flex items-center gap-2 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors disabled:cursor-not-allowed disabled:opacity-60";

type LogoutButtonProps = {
  variant: "icon" | "link";
};

function LogoutSubmitButton({ variant }: LogoutButtonProps) {
  const { pending } = useFormStatus();

  if (variant === "icon") {
    return (
      <button
        aria-busy={pending}
        aria-label={LOGOUT_LABEL}
        className={ICON_CLASSES}
        disabled={pending}
        title={LOGOUT_LABEL}
        type="submit"
      >
        <Icon name={LOGOUT_ICON} size={ICON_VARIANT_ICON_SIZE} />
      </button>
    );
  }

  return (
    <button
      aria-busy={pending}
      className={LINK_CLASSES}
      disabled={pending}
      type="submit"
    >
      <Icon name={LOGOUT_ICON} size={LINK_VARIANT_ICON_SIZE} />
      <span>{LOGOUT_LABEL}</span>
    </button>
  );
}

export default function LogoutButton({ variant }: LogoutButtonProps) {
  return (
    <form action={signOut} className="contents">
      <LogoutSubmitButton variant={variant} />
    </form>
  );
}
