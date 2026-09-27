import Icon from "@/app/components/Icons";
import { loginScreen } from "@/data/mock-auth";
import BrandLockup from "./BrandLockup";

const BLOB_CLASSES = "auth-hero-blob bg-white/[0.14]";

const BLOB_TOP_CLASSES = `${BLOB_CLASSES} h-[460px] w-[460px] -right-[130px] -top-[120px]`;
const BLOB_BOTTOM_CLASSES = `${BLOB_CLASSES} h-[380px] w-[380px] -bottom-[90px] -left-[90px]`;

const HEADLINE_CLASSES = "font-display-lg text-display-lg text-on-primary";
const SUBTITLE_CLASSES =
  "mt-5 text-body-md text-on-primary/85 leading-relaxed sm:text-body-lg";
const FOOTER_CLASSES =
  "flex items-center gap-2 pt-4 text-body-md font-medium text-on-primary/90";

export default function LoginBrandPanel() {
  const { brand, hero } = loginScreen;

  return (
    <section className="auth-hero-gradient relative flex w-full flex-col justify-between overflow-hidden p-8 text-on-primary md:w-[48%] md:p-12">
      <div aria-hidden="true" className={BLOB_TOP_CLASSES} />
      <div aria-hidden="true" className={BLOB_BOTTOM_CLASSES} />

      <header className="relative z-10 flex items-center gap-3">
        <BrandLockup brand={brand} variant="hero" />
      </header>

      <div className="relative z-10 my-10 max-w-sm md:my-auto">
        <h1 className={HEADLINE_CLASSES}>{hero.headline}</h1>
        <p className={SUBTITLE_CLASSES}>{hero.body}</p>
      </div>

      <footer className={FOOTER_CLASSES}>
        <Icon name="eco" size={18} />
        <span>{brand.centerName}</span>
      </footer>
    </section>
  );
}
