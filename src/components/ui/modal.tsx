"use client";

import { useEffect, type ReactNode } from "react";

const DEFAULT_OVERLAY_CLASSNAME =
  "fixed inset-0 z-[60] flex items-center justify-center bg-teal-950/50 p-4 backdrop-blur-sm";

const DEFAULT_PANEL_CLASSNAME =
  "w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  loading?: boolean;
  ariaLabelledBy?: string;
  overlayClassName?: string;
  panelClassName?: string;
};

export function Modal({
  open,
  onClose,
  children,
  loading = false,
  ariaLabelledBy,
  overlayClassName = DEFAULT_OVERLAY_CLASSNAME,
  panelClassName = DEFAULT_PANEL_CLASSNAME,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div
      className={overlayClassName}
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        className={panelClassName}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalActions({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex justify-end gap-3">{children}</div>;
}

export function ModalError({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-sm text-red-600">{children}</p>;
}
