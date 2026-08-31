"use client";

import { useId } from "react";
import { Modal, ModalActions, ModalError } from "@/components/ui/modal";
import { TrashIcon } from "@/components/ui/icon";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  error?: string | null;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  message,
  error,
  confirmLabel = "Delete",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const titleId = useId();

  return (
    <Modal
      open={open}
      onClose={onCancel}
      loading={loading}
      ariaLabelledBy={titleId}
    >
      <h2
        id={titleId}
        className="flex items-center gap-2 text-lg font-semibold text-slate-900"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600">
          <TrashIcon size={18} />
        </span>
        {title}
      </h2>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
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
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Deleting…" : confirmLabel}
        </button>
      </ModalActions>
    </Modal>
  );
}
