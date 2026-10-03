import Icon from "@/app/components/Icons";
import { SIDEBAR_LEFT_CLASS } from "@/app/components/panel-aula/shell";
import { enrollmentScreen } from "@/data/mock-enrollment";

export default function StickyActionBar() {
  const { stickyBar } = enrollmentScreen;

  return (
    <aside
      className={`fixed bottom-0 left-0 ${SIDEBAR_LEFT_CLASS} right-0 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-30 py-4 px-8`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-on-surface-variant">
          <Icon className="text-primary" name="lock_clock" size={20} />
          <span className="font-body-sm text-body-sm">{stickyBar.privacy}</span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            className="px-5 py-2.5 rounded-xl font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
            type="button"
          >
            {stickyBar.cancel}
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            type="button"
          >
            <Icon name="how_to_reg" size={20} />
            <span>{stickyBar.submit}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
