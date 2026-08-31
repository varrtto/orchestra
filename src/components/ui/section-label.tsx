import type { ReactNode } from "react";

export function SectionLabel({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <span className="text-teal-700">{icon}</span>
      {children}
    </h3>
  );
}
