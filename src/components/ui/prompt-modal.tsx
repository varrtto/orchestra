"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Modal, ModalActions, ModalError } from "@/components/ui/modal";

type PromptModalProps = {
  open: boolean;
  title: string;
  label: string;
  placeholder?: string;
  confirmLabel?: string;
  initialValue?: string;
  error?: string | null;
  loading?: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
};

export function PromptModal({
  open,
  title,
  label,
  placeholder,
  confirmLabel = "Save",
  initialValue = "",
  error,
  loading = false,
  onConfirm,
  onCancel,
}: PromptModalProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    onConfirm(trimmed);
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      loading={loading}
      ariaLabelledBy={titleId}
    >
      <h2 id={titleId} className="text-lg font-semibold text-slate-900">
        {title}
      </h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor={`${titleId}-input`} className="sr-only">
            {label}
          </label>
          <input
            ref={inputRef}
            id={`${titleId}-input`}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
            disabled={loading}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 focus:ring-2 disabled:bg-slate-50"
          />
        </div>
        {error && <ModalError>{error}</ModalError>}
        <ModalActions>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !value.trim()}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:opacity-50"
          >
            {loading ? "Saving…" : confirmLabel}
          </button>
        </ModalActions>
      </form>
    </Modal>
  );
}
