"use client";

import { ArrowRightIcon, GearIcon } from "@/components/ui/icon";

export function BoardSettingsToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={open ? "Close board settings" : "Open board settings"}
      aria-expanded={open}
      onClick={onToggle}
      className={`absolute right-0 top-2 z-20 inline-flex size-9 cursor-pointer items-center justify-center border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-300 ease-in-out hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 rounded-l-lg border-r-0`}
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
