"use client";

import { BoardIcon } from "@/components/ui/icon";

export function BrandMark({
  size = "lg",
}: {
  size?: "sm" | "lg";
}) {
  const iconSize = size === "lg" ? 36 : 22;
  const textClass =
    size === "lg"
      ? "font-display text-4xl tracking-tight text-teal-950"
      : "font-display text-xl text-teal-950";

  return (
    <div className="flex items-center justify-center gap-2.5">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700 text-white shadow-md shadow-teal-900/20">
        <BoardIcon size={iconSize} color="currentColor" />
      </span>
      <span className={textClass}>Orchest</span>
    </div>
  );
}
