import Icon from "@/app/components/Icons";
import FallbackImage from "@/app/components/panel-aula/FallbackImage";
import { enrollmentScreen } from "@/data/mock-enrollment";
import BirthDateField from "./BirthDateField";
import FormSection from "./FormSection";

const TEXT_INPUT_CLASSES =
  "w-full px-4 py-3 bg-surface rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none shadow-sm transition-all";

const ICON_INPUT_CLASSES =
  "w-full pl-11 pr-4 py-3 bg-surface rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none shadow-sm transition-all";

export default function IdentitySection() {
  const { identity, avatar, defaults } = enrollmentScreen;

  return (
    <FormSection
      badge={{
        label: identity.badge,
        className:
          "font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-bold",
      }}
      number={identity.number}
      subtitle={identity.subtitle}
      title={identity.title}
    >
      <div className="space-y-6">
        <div className="p-4 rounded-2xl bg-surface-container-low flex flex-col sm:flex-row items-center gap-5">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-surface-container-highest overflow-hidden flex items-center justify-center shadow-inner">
              <FallbackImage
                alt={avatar.alt}
                className="w-24 h-24 object-cover"
                initials={avatar.initials}
                initialsClassName="rounded-full bg-primary-container text-on-primary font-headline-sm text-headline-sm font-bold"
                src={avatar.src}
              />
            </div>
            <label
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center cursor-pointer shadow-md hover:scale-105 transition-transform"
              htmlFor="avatar-input"
              title="Cambiar fotografía"
            >
              <Icon name="photo_camera" size={16} />
              <input accept="image/*" className="hidden" id="avatar-input" type="file" />
            </label>
          </div>
          <div className="flex flex-col text-center sm:text-left gap-1">
            <span className="font-label-lg text-label-lg text-on-surface">
              {avatar.label}
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {avatar.description}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2 justify-center sm:justify-start">
              <button
                className="text-primary font-label-sm text-label-sm hover:underline flex items-center gap-1"
                type="button"
              >
                <Icon name="face" size={14} />
                {avatar.pickIllustration}
              </button>
              <span className="text-outline-variant">•</span>
              <button
                className="text-on-surface-variant font-label-sm text-label-sm hover:underline"
                type="button"
              >
                {avatar.takePhoto}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label
            className="block font-label-lg text-label-lg text-on-surface mb-2"
            htmlFor="child-full-name"
          >
            {identity.fullNameLabel} <span className="text-error">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
              <Icon name="badge" size={20} />
            </div>
            <input
              className={ICON_INPUT_CLASSES}
              id="child-full-name"
              placeholder={identity.fullNamePlaceholder}
              required
              type="text"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <BirthDateField
            defaultValue={defaults.birthDate}
            initialAgeLabel={defaults.ageLabel}
            label={identity.birthDateLabel}
          />
          <div>
            <label className="block font-label-lg text-label-lg text-on-surface mb-2">
              {identity.genderLabel}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {identity.genderOptions.map((option) => (
                <label className="cursor-pointer" key={option.value}>
                  <input
                    className="peer sr-only"
                    defaultChecked={option.value === defaults.gender}
                    name="gender"
                    type="radio"
                    value={option.value}
                  />
                  <div className="h-11 rounded-xl bg-surface peer-checked:bg-primary-container peer-checked:text-on-primary text-on-surface-variant flex items-center justify-center gap-1.5 font-label-md text-label-md transition-all shadow-sm">
                    <Icon name={option.icon} size={16} />
                    <span>{option.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          <div>
            <label
              className="block font-label-lg text-label-lg text-on-surface mb-2"
              htmlFor="child-doc-id"
            >
              {identity.documentLabel}
            </label>
            <input
              className={TEXT_INPUT_CLASSES}
              id="child-doc-id"
              placeholder={identity.documentPlaceholder}
              type="text"
            />
          </div>
          <div>
            <label
              className="block font-label-lg text-label-lg text-on-surface mb-2"
              htmlFor="child-nickname"
            >
              {identity.nicknameLabel}
            </label>
            <input
              className={TEXT_INPUT_CLASSES}
              id="child-nickname"
              placeholder={identity.nicknamePlaceholder}
              type="text"
            />
          </div>
        </div>
      </div>
    </FormSection>
  );
}
