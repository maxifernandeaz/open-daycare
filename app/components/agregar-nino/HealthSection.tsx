import Icon from "@/app/components/Icons";
import { enrollmentScreen } from "@/data/mock-enrollment";
import AllergyChips from "./AllergyChips";
import FormSection from "./FormSection";

export default function HealthSection() {
  const { health, allergyChips, addAllergyChip, defaults } = enrollmentScreen;

  return (
    <FormSection
      className="bg-error-container/30"
      compact
      icon={{ name: "medical_services", className: "bg-error text-on-error" }}
      subtitle={health.protocolLabel}
      subtitleClassName="font-label-sm text-label-sm text-error font-bold uppercase tracking-wider"
      title={health.title}
      trailing={<Icon className="text-error" name="priority_high" size={24} />}
    >
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
        {health.description}
      </p>

      <div className="space-y-2 mb-5">
        <label className="block font-label-md text-label-md text-on-surface">
          {health.chipsLabel}
        </label>
        <AllergyChips addLabel={addAllergyChip} chips={allergyChips} />
      </div>

      <div className="mb-5">
        <label
          className="block font-label-md text-label-md text-on-surface mb-2"
          htmlFor="allergy-details"
        >
          {health.detailsLabel}
        </label>
        <textarea
          className="w-full p-3.5 bg-surface-container-lowest rounded-xl font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none shadow-sm transition-all"
          id="allergy-details"
          placeholder={health.detailsPlaceholder}
          rows={3}
        />
      </div>

      <div className="p-3.5 rounded-2xl bg-surface-container-lowest flex items-start gap-3 shadow-sm">
        <div className="flex items-center h-6">
          <input
            className="w-5 h-5 rounded-lg bg-surface cursor-pointer accent-error"
            defaultChecked={defaults.urgentMedicalFlag}
            id="urgent-medical-flag"
            type="checkbox"
          />
        </div>
        <label className="cursor-pointer select-none" htmlFor="urgent-medical-flag">
          <span className="block font-label-md text-label-md text-on-surface font-bold">
            {health.urgentLabel}
          </span>
          <span className="block font-body-sm text-body-sm text-on-surface-variant">
            {health.urgentDescription}
          </span>
        </label>
      </div>
    </FormSection>
  );
}
