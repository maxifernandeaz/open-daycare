"use client";

import { useState } from "react";
import Icon from "@/app/components/Icons";
import type { AllergyOption } from "@/app/agregar-nino/catalogs";

const CHIP_CLASSES =
  "px-3 py-1.5 rounded-full font-label-sm text-label-sm shadow-sm flex items-center gap-1 transition-colors";

const CHIP_IDLE_CLASSES = "bg-surface-container-lowest text-on-surface-variant";
const CHIP_HOVER_NO_ALLERGY_CLASSES = "hover:bg-surface-container-high";
const CHIP_HOVER_SPECIFIC_CLASSES = "hover:bg-error-container hover:text-error";
const CHIP_ACTIVE_NO_ALLERGY_CLASSES = "bg-primary-fixed text-on-primary-fixed";
const CHIP_ACTIVE_SPECIFIC_CLASSES = "bg-error-container text-error";

const ADD_CHIP_CLASSES =
  "px-3 py-1.5 rounded-full font-label-sm text-label-sm shadow-sm flex items-center gap-1 transition-colors bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary";

type AllergyChipsProps = {
  allergies: AllergyOption[];
  addLabel: string;
};

export default function AllergyChips({ allergies, addLabel }: AllergyChipsProps) {
  const noneCode = allergies.find((allergy) => allergy.isNone)?.code;
  const [selectedCodes, setSelectedCodes] = useState<string[]>(
    noneCode ? [noneCode] : [],
  );

  const toggleChip = (code: string) => {
    setSelectedCodes((current) => {
      if (code === noneCode) return noneCode ? [noneCode] : [];

      const selectedSpecific = current.filter((id) => id !== noneCode);
      return selectedSpecific.includes(code)
        ? selectedSpecific.filter((id) => id !== code)
        : [...selectedSpecific, code];
    });
  };

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <input name="allergy_codes" type="hidden" value={selectedCodes.join(",")} />

      {allergies.map((allergy) => {
        const isSelected = selectedCodes.includes(allergy.code);
        const isNoAllergy = allergy.isNone;

        const className = isSelected
          ? `${CHIP_CLASSES} ${
              isNoAllergy ? CHIP_ACTIVE_NO_ALLERGY_CLASSES : CHIP_ACTIVE_SPECIFIC_CLASSES
            }`
          : `${CHIP_CLASSES} ${CHIP_IDLE_CLASSES} ${
              isNoAllergy ? CHIP_HOVER_NO_ALLERGY_CLASSES : CHIP_HOVER_SPECIFIC_CLASSES
            }`;

        return (
          <button
            aria-pressed={isSelected}
            className={className}
            key={allergy.code}
            onClick={() => toggleChip(allergy.code)}
            type="button"
          >
            {isNoAllergy ? (
              <Icon className="text-primary" name="check_circle" size={14} />
            ) : null}
            <span>{allergy.label}</span>
          </button>
        );
      })}

      <button className={ADD_CHIP_CLASSES} type="button">
        <Icon name="add" size={14} />
        <span>{addLabel}</span>
      </button>
    </div>
  );
}
