"use client";

import { useTransition } from "react";
import Icon from "@/app/components/Icons";
import { signOut } from "@/app/auth/actions";

const ICON_CLASSES =
  "w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const LINK_CLASSES =
  "inline-flex items-center gap-2 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors disabled:cursor-not-allowed disabled:opacity-60";

type LogoutButtonProps = {
  variant: "icon" | "link";
};

export default function LogoutButton({ variant }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  if (variant === "icon") {
    return (
      <button
        aria-label="Cerrar sesión"
        className={ICON_CLASSES}
        disabled={isPending}
        onClick={handleLogout}
        title="Cerrar sesión"
        type="button"
      >
        <Icon name="logout" size={20} />
      </button>
    );
  }

  return (
    <button
      className={LINK_CLASSES}
      disabled={isPending}
      onClick={handleLogout}
      type="button"
    >
      <Icon name="logout" size={18} />
      <span>Cerrar sesión</span>
    </button>
  );
}
