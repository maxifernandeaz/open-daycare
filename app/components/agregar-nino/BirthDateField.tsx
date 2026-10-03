"use client";

import { useId, useState } from "react";
import type { ChangeEvent } from "react";
import Icon from "@/app/components/Icons";

function calculateAgeLabel(birthDate: string, today = new Date()): string {
  const [year, month] = birthDate.split("-").map(Number);
  if (!year || !month) return "";

  const months = (today.getFullYear() - year) * 12 + (today.getMonth() + 1 - month);

  if (months < 12) return `${Math.max(1, months)} meses (Lactante)`;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return `${years} ${years === 1 ? "año" : "años"}${
    remainingMonths > 0 ? ` ${remainingMonths} m` : ""
  }`;
}

type BirthDateFieldProps = {
  label: string;
  defaultValue: string;
  initialAgeLabel: string;
};

export default function BirthDateField({
  label,
  defaultValue,
  initialAgeLabel,
}: BirthDateFieldProps) {
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const [ageLabel, setAgeLabel] = useState(initialAgeLabel);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setValue(nextValue);

    const nextAgeLabel = calculateAgeLabel(nextValue);
    if (nextAgeLabel) setAgeLabel(nextAgeLabel);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="font-label-lg text-label-lg text-on-surface" htmlFor={id}>
          {label} <span className="text-error">*</span>
        </label>
        <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold flex items-center gap-1">
          <Icon name="schedule" size={12} />
          <span>{ageLabel}</span>
        </span>
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
          <Icon name="cake" size={20} />
        </div>
        <input
          className="w-full pl-11 pr-4 py-3 bg-surface rounded-xl font-body-md text-body-md text-on-surface focus:bg-surface-container-lowest focus:outline-none shadow-sm transition-all"
          id={id}
          onChange={handleChange}
          type="date"
          value={value}
        />
      </div>
    </div>
  );
}
