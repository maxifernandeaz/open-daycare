import Icon from "@/app/components/Icons";
import { enrollmentScreen } from "@/data/mock-enrollment";
import FormSection from "./FormSection";

const TEXT_INPUT_CLASSES =
  "w-full px-3 py-2.5 bg-surface rounded-xl font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none shadow-sm";

export default function SpecialCareSection() {
  const { specialCare, defaults } = enrollmentScreen;

  return (
    <FormSection
      compact
      number={specialCare.number}
      subtitle={specialCare.subtitle}
      title={specialCare.title}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              className="block font-label-sm text-label-sm text-on-surface mb-1"
              htmlFor="pediatrician-name"
            >
              {specialCare.pediatricianLabel}
            </label>
            <input
              className={TEXT_INPUT_CLASSES}
              id="pediatrician-name"
              placeholder={specialCare.pediatricianPlaceholder}
              type="text"
            />
          </div>
          <div>
            <label
              className="block font-label-sm text-label-sm text-on-surface mb-1"
              htmlFor="pediatrician-phone"
            >
              {specialCare.phoneLabel}
            </label>
            <input
              className={TEXT_INPUT_CLASSES}
              id="pediatrician-phone"
              placeholder={specialCare.phonePlaceholder}
              type="tel"
            />
          </div>
        </div>

        <div>
          <label
            className="block font-label-md text-label-md text-on-surface mb-1.5"
            htmlFor="care-notes"
          >
            {specialCare.careNotesLabel}
          </label>
          <textarea
            className="w-full p-3.5 bg-surface rounded-xl font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none shadow-sm transition-all"
            id="care-notes"
            placeholder={specialCare.careNotesPlaceholder}
            rows={3}
          />
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-container-low flex items-start gap-3">
          <div className="flex items-center h-6">
            <input
              className="w-4 h-4 rounded-md bg-surface-container-lowest cursor-pointer accent-primary"
              defaultChecked={defaults.medicationConsent}
              id="medication-consent"
              type="checkbox"
            />
          </div>
          <label className="cursor-pointer select-none" htmlFor="medication-consent">
            <span className="block font-label-md text-label-md text-on-surface font-semibold">
              {specialCare.medicationLabel}
            </span>
            <span className="block font-body-sm text-body-sm text-on-surface-variant">
              {specialCare.medicationDescription}
            </span>
          </label>
        </div>
      </div>

      <div className="mt-5 p-3 rounded-xl bg-surface flex items-center gap-3">
        <Icon className="text-secondary" name="assignment_ind" size={20} />
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          {specialCare.vaccinationBanner}
        </span>
      </div>
    </FormSection>
  );
}
