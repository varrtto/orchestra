"use client";

import { useT } from "@/components/providers/locale-provider";
import { useTheme } from "@/components/providers/theme-provider";

export function ThemeToggle() {
  const t = useT();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t("nav.switchToLight") : t("nav.switchToDark")}
      aria-pressed={isDark}
      title={isDark ? t("nav.switchToLight") : t("nav.switchToDark")}
      className="theme-toggle group relative inline-flex h-9 w-14 shrink-0 cursor-pointer items-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 p-0.5 shadow-sm transition-[border-color,background-color,box-shadow] duration-300 hover:border-teal-200 hover:bg-teal-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-teal-700 dark:hover:bg-slate-700"
    >
      <span
        aria-hidden
        className={`absolute inset-y-0.5 left-0.5 flex size-8 items-center justify-center rounded-full bg-white text-amber-500 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)] dark:bg-slate-950 dark:text-teal-200 ${
          isDark ? "translate-x-5 rotate-180" : "translate-x-0 rotate-0"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className={`absolute size-[1.05rem] transition-all duration-400 ease-out ${
            isDark
              ? "scale-50 rotate-90 opacity-0"
              : "scale-100 rotate-0 opacity-100"
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6" />
        </svg>
        <svg
          viewBox="0 0 24 24"
          className={`absolute size-[1.05rem] transition-all duration-400 ease-out ${
            isDark
              ? "scale-100 rotate-0 opacity-100"
              : "scale-50 -rotate-90 opacity-0"
          }`}
          fill="currentColor"
        >
          <path d="M14.6 3.1a8.8 8.8 0 0 0-1.3.1 8 8 0 1 0 7.5 10.4A7 7 0 0 1 14.6 3.1Z" />
        </svg>
      </span>
      <span className="sr-only">
        {isDark ? t("nav.switchToLight") : t("nav.switchToDark")}
      </span>
    </button>
  );
}
