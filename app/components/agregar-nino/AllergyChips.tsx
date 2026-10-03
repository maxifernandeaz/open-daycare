"use client";

import { useState } from "react";
import Icon from "@/app/components/Icons";
import type { Chip } from "@/data/mock-enrollment";

const NO_ALLERGY_ID = "none";

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
  chips: Chip[];
  addLabel: string;
  defaultSelectedId?: string;
};

export default function AllergyChips({
  chips,
  addLabel,
  defaultSelectedId = NO_ALLERGY_ID,
}: AllergyChipsProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([defaultSelectedId]);

  const toggleChip = (chipId: string) => {
    setSelectedIds((current) => {
      if (chipId === NO_ALLERGY_ID) return [NO_ALLERGY_ID];

      const selectedSpecific = current.filter((id) => id !== NO_ALLERGY_ID);
      return selectedSpecific.includes(chipId)
        ? selectedSpecific.filter((id) => id !== chipId)
        : [...selectedSpecific, chipId];
    });
  };

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {chips.map((chip) => {
        const isSelected = selectedIds.includes(chip.id);
        const isNoAllergy = chip.id === NO_ALLERGY_ID;

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
            key={chip.id}
            onClick={() => toggleChip(chip.id)}
            type="button"
          >
            {isNoAllergy ? (
              <Icon className="text-primary" name="check_circle" size={14} />
            ) : null}
            <span>{chip.label}</span>
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
