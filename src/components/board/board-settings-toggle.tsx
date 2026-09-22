"use client";

import { ArrowRightIcon, GearIcon } from "@/components/ui/icon";
import { useT } from "@/components/providers/locale-provider";

export function BoardSettingsToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const t = useT();

  return (
    <button
      type="button"
      aria-label={open ? t("board.closeSettings") : t("board.openSettings")}
      aria-expanded={open}
      onClick={onToggle}
      className={`absolute right-0 top-2 z-20 inline-flex size-9 cursor-pointer items-center justify-center border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-sm transition-all duration-300 ease-in-out hover:border-teal-200 dark:hover:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950 hover:text-teal-800 dark:hover:text-teal-300 rounded-l-lg border-r-0`}
    >
      <span className="relative flex size-5 items-center justify-center">
        <GearIcon
          size={20}
          color="#0f766e"
          className={`absolute transition-all duration-300 ease-in-out ${
            open
              ? "scale-75 opacity-0 rotate-90"
              : "scale-100 opacity-100 rotate-0"
          }`}
        />
        <ArrowRightIcon
          size={18}
          className={`absolute transition-all duration-300 ease-in-out ${
            open
              ? "scale-100 opacity-100 rotate-0"
              : "scale-75 opacity-0 -rotate-90"
          }`}
        />
      </span>
    </button>
  );
}
