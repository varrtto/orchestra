"use client";

import { useT } from "@/components/providers/locale-provider";

export function Spinner({ className = "" }: { className?: string }) {
  const t = useT();
  return (
    <div
      role="status"
      aria-label={t("common.loading")}
      className={`spinner ${className}`}
    />
  );
}

export function CenteredSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner />
    </div>
  );
}
