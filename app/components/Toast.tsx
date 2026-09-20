"use client";

import { useEffect, useState } from "react";
import Icon from "@/app/components/Icons";

type ToastProps = {
  message: string | null;
};

const TOAST_DURATION_MS = 3500;

export default function Toast({ message }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    const appearFrame = window.requestAnimationFrame(() => setVisible(true));
    const hideTimer = window.setTimeout(() => setVisible(false), TOAST_DURATION_MS);
    return () => {
      window.cancelAnimationFrame(appearFrame);
      window.clearTimeout(hideTimer);
    };
  }, [message]);

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 bg-inverse-surface text-inverse-on-surface px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-20 opacity-0 pointer-events-none"
      }`}
    >
      <Icon name="check_circle" size={20} fill className="text-primary-fixed" />
      <span className="font-label-lg text-label-lg">{message}</span>
    </div>
  );
}