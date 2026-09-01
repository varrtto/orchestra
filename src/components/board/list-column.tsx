"use client";

import { useEffect, useMemo, useState } from "react";
import { useDragAndDrop } from "@formkit/drag-and-drop/react";
import { cardDndConfig, isCardDndActive } from "@/lib/board-card-dnd";
import { useBoardStore } from "@/stores/board-store";
import {
  useAddCardMutation,
  useDeleteListMutation,
  useRenameListMutation,
} from "@/hooks/use-board-mutations";
import type { Card, List } from "@/lib/types";
import { CardItem } from "@/components/board/card-item";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { MenuIcon, PlusIcon, TrashIcon } from "@/components/ui/icon";

type ListColumnProps = {
  list: List;
  columnRef?: (element: HTMLDivElement | null) => void;
  isDragging?: boolean;
  onGripPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
};

function sameCardOrder(a: Card[], b: Card[]) {
  if (a.length !== b.length) return false;
  return a.every((card, i) => card.id === b[i]?.id);
}

export function ListColumn({
  list,
  columnRef,
  isDragging = false,
  onGripPointerDown,
}: ListColumnProps) {
  const allCards = useBoardStore((s) => s.cards);
  const canEdit = useBoardStore((s) => s.canEdit);
  const renameList = useRenameListMutation();
  const deleteList = useDeleteListMutation();
  const addCard = useAddCardMutation();
  const editable = canEdit();

  const listCards = useMemo(
    () =>
      allCards
        .filter((c) => c.list_id === list.id)
        .sort((a, b) => a.position - b.position),
    [allCards, list.id],
  );

  const [parentRef, cards, setCards] = useDragAndDrop<HTMLUListElement, Card>(
    listCards,
    {
      ...cardDndConfig,
      disabled: !editable,
    },
  );

  useEffect(() => {
    if (isCardDndActive()) return;
    setCards((prev) => (sameCardOrder(prev, listCards) ? prev : listCards));
  }, [listCards, setCards]);

  const [draft, setDraft] = useState("");
  const [addCardError, setAddCardError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function onConfirmDelete() {
    setDeleteError(null);
    try {
      await deleteList.mutateAsync(list.id);
      setConfirmDelete(false);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete column",
      );
    }
  }

  async function onAddCard(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setAddCardError(null);
    try {
      await addCard.mutateAsync({ listId: list.id, title: draft.trim() });
      setDraft("");
    } catch (err) {
      setAddCardError(
        err instanceof Error ? err.message : "Failed to create card",
      );
    }
  }

  return (
    <div
      ref={columnRef}
      className={`flex h-full max-h-full min-h-0 w-72 shrink-0 flex-col rounded-xl bg-column shadow-lg shadow-black/20 ${
        isDragging ? "opacity-60 ring-2 ring-teal-600/40" : ""
      }`}
    >
      <div className="flex items-center gap-1 border-b border-teal-900/10 px-2 py-2">
        {editable && (
          <div
            role="button"
            tabIndex={0}
            aria-label="Drag to reorder list"
            className="touch-none cursor-grab rounded p-1 text-slate-400 hover:bg-white/60 hover:text-slate-700 active:cursor-grabbing"
            onPointerDown={onGripPointerDown}
          >
            <MenuIcon size={14} className="pointer-events-none" />
          </div>
        )}
        <input
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none"
          defaultValue={list.title}
          disabled={!editable}
          onBlur={(e) => {
            const next = e.target.value.trim();
            if (next && next !== list.title) {
              renameList.mutate({ listId: list.id, title: next });
            } else {
              e.target.value = list.title;
            }
          }}
        />
        {editable && (
          <button
            type="button"
            className="cursor-pointer rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Delete column"
            onClick={() => {
              setDeleteError(null);
              setConfirmDelete(true);
            }}
          >
            <TrashIcon size={14} />
          </button>
        )}
      </div>

      <ul
        ref={parentRef}
        data-list-id={list.id}
        className="flex min-h-16 flex-1 flex-col gap-2 overflow-y-auto p-2"
      >
        {cards.map((card) => (
          <CardItem key={card.id} card={card} />
        ))}
      </ul>

      {editable && (
        <form onSubmit={onAddCard} className="border-t border-teal-900/10 p-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
              <PlusIcon size={14} />
            </span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a card…"
              disabled={addCard.isPending}
              className="w-full rounded-lg border border-transparent bg-white/70 py-1.5 pl-7 pr-2 text-sm outline-none ring-teal-600 placeholder:text-slate-400 focus:border-teal-700/20 focus:ring-1 disabled:opacity-60"
            />
          </div>
          {addCardError && (
            <p className="mt-1 text-xs text-red-600">{addCardError}</p>
          )}
        </form>
      )}

      <ConfirmModal
        open={confirmDelete}
        title="Delete column?"
        message={`“${list.title}” and all of its cards will be permanently deleted.`}
        confirmLabel="Delete column"
        error={deleteError}
        loading={deleteList.isPending}
        onConfirm={() => void onConfirmDelete()}
        onCancel={() => {
          if (!deleteList.isPending) {
            setConfirmDelete(false);
            setDeleteError(null);
          }
        }}
      />
    </div>
  );
}
