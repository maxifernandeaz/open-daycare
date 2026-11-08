import Icon from "@/app/components/Icons";
import type { AllergyOption } from "@/app/agregar-nino/catalogs";
import { enrollmentScreen } from "@/data/mock-enrollment";
import AllergyChips from "./AllergyChips";
import FormSection from "./FormSection";

const ALERT_ICON_SIZE = 24;
const ALLERGY_DETAILS_ROWS = 3;

const ALLERGY_DETAILS_FIELD_ID = "allergy-details";
const ALLERGY_DETAILS_FIELD_NAME = "allergy_notes";
const URGENT_MEDICAL_FLAG_FIELD_ID = "urgent-medical-flag";
const URGENT_MEDICAL_FLAG_FIELD_NAME = "urgent_medical_flag";
const URGENT_MEDICAL_DESCRIPTION_ID = "urgent-medical-flag-description";

const SECTION_CLASSES = "bg-error-container/30";
const SECTION_ICON = {
  name: "medical_services",
  className: "bg-error text-on-error",
};
const SECTION_SUBTITLE_CLASSES =
  "font-label-sm text-label-sm text-error font-bold uppercase tracking-wider";
const SECTION_DESCRIPTION_CLASSES =
  "font-body-sm text-body-sm text-on-surface-variant mb-4";
const ALLERGY_GROUP_CLASSES = "mb-5 min-w-0 border-0 p-0";
const ALLERGY_GROUP_LEGEND_CLASSES =
  "block font-label-md text-label-md text-on-surface mb-2 p-0";
const DETAILS_FIELD_CLASSES = "mb-5";
const DETAILS_LABEL_CLASSES =
  "block font-label-md text-label-md text-on-surface mb-2";
const DETAILS_TEXTAREA_CLASSES =
  "w-full p-3.5 bg-surface-container-lowest rounded-xl font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none shadow-sm transition-all";
const URGENT_FLAG_CONTAINER_CLASSES =
  "p-3.5 rounded-2xl bg-surface-container-lowest flex items-start gap-3 shadow-sm";
const URGENT_FLAG_CHECKBOX_CLASSES =
  "w-5 h-5 rounded-lg bg-surface cursor-pointer accent-error";
const URGENT_FLAG_LABEL_CLASSES =
  "block font-label-md text-label-md text-on-surface font-bold";
const URGENT_FLAG_DESCRIPTION_CLASSES =
  "block font-body-sm text-body-sm text-on-surface-variant";

type HealthSectionProps = {
  allergies: AllergyOption[];
};

export default function HealthSection({ allergies }: HealthSectionProps) {
  const { health, addAllergyChip, defaults } = enrollmentScreen;

  return (
    <FormSection
      className={SECTION_CLASSES}
      compact
      icon={SECTION_ICON}
      subtitle={health.protocolLabel}
      subtitleClassName={SECTION_SUBTITLE_CLASSES}
      title={health.title}
      trailing={
        <Icon
          className="text-error"
          name="priority_high"
          size={ALERT_ICON_SIZE}
        />
      }
    >
      <p className={SECTION_DESCRIPTION_CLASSES}>{health.description}</p>

      <fieldset className={ALLERGY_GROUP_CLASSES}>
        <legend className={ALLERGY_GROUP_LEGEND_CLASSES}>
          {health.chipsLabel}
        </legend>
        <AllergyChips addLabel={addAllergyChip} allergies={allergies} />
      </fieldset>

      <div className={DETAILS_FIELD_CLASSES}>
        <label
          className={DETAILS_LABEL_CLASSES}
          htmlFor={ALLERGY_DETAILS_FIELD_ID}
        >
          {health.detailsLabel}
        </label>
        <textarea
          className={DETAILS_TEXTAREA_CLASSES}
          id={ALLERGY_DETAILS_FIELD_ID}
          name={ALLERGY_DETAILS_FIELD_NAME}
          placeholder={health.detailsPlaceholder}
          rows={ALLERGY_DETAILS_ROWS}
        />
      </div>

      <div className={URGENT_FLAG_CONTAINER_CLASSES}>
        <div className="flex items-center h-6">
          <input
            aria-describedby={URGENT_MEDICAL_DESCRIPTION_ID}
            className={URGENT_FLAG_CHECKBOX_CLASSES}
            defaultChecked={defaults.urgentMedicalFlag}
            id={URGENT_MEDICAL_FLAG_FIELD_ID}
            name={URGENT_MEDICAL_FLAG_FIELD_NAME}
            type="checkbox"
          />
        </div>
        <div>
          <label
            className="cursor-pointer select-none"
            htmlFor={URGENT_MEDICAL_FLAG_FIELD_ID}
          >
            <span className={URGENT_FLAG_LABEL_CLASSES}>
              {health.urgentLabel}
            </span>
          </label>
          <span
            className={URGENT_FLAG_DESCRIPTION_CLASSES}
            id={URGENT_MEDICAL_DESCRIPTION_ID}
          >
            {health.urgentDescription}
          </span>
        </div>
      </div>
    </FormSection>
  );
}
