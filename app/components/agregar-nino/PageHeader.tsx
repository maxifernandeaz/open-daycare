import { Fragment } from "react";
import Icon from "@/app/components/Icons";
import { enrollmentScreen } from "@/data/mock-enrollment";

export default function PageHeader() {
  const { breadcrumb, header, topActions } = enrollmentScreen;
  const lastIndex = breadcrumb.length - 1;

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6">
      <div className="flex flex-col gap-1.5">
        <nav
          aria-label="Ruta de navegación"
          className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md"
        >
          {breadcrumb.map((item, index) => (
            <Fragment key={item.label}>
              {index > 0 ? (
                <Icon
                  className="text-outline-variant"
                  name="chevron_right"
                  size={14}
                />
              ) : null}
              {index === lastIndex ? (
                <span className="text-primary font-bold">{item.label}</span>
              ) : (
                <a
                  className={
                    index === 0
                      ? "hover:text-primary transition-colors flex items-center gap-1"
                      : "hover:text-primary transition-colors"
                  }
                  href={item.href}
                >
                  {item.icon ? <Icon name={item.icon} size={16} /> : null}
                  <span>{item.label}</span>
                </a>
              )}
            </Fragment>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary shadow-sm">
            <Icon name={header.icon} size={24} />
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              {header.title}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
              {header.subtitle}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
        <button
          className="px-5 py-2.5 rounded-xl font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low transition-all duration-200"
          type="button"
        >
          {topActions.discard}
        </button>
        <button
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          type="button"
        >
          <Icon name="verified" size={18} />
          <span>{topActions.save}</span>
        </button>
      </div>
    </div>
  );
}
