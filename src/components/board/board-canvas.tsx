"use client";

import { useEffect, useRef, useState } from "react";
import { registerCardLayoutCommit } from "@/lib/board-card-dnd";
import { useBoardStore } from "@/stores/board-store";
import {
  useAddListMutation,
  useCommitListsLayoutMutation,
  useReorderListsMutation,
} from "@/hooks/use-board-mutations";
import type { List } from "@/lib/types";
import { ListColumn } from "@/components/board/list-column";
import { PromptModal } from "@/components/ui/prompt-modal";
import { PlusIcon } from "@/components/ui/icon";

function reorderListsLocal(lists: List[], draggedId: string, toIndex: number) {
  const fromIndex = lists.findIndex((list) => list.id === draggedId);
  if (fromIndex < 0 || fromIndex === toIndex) return lists;
  const next = [...lists];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function getTargetIndex(
  clientX: number,
  lists: List[],
  columnRefs: Map<string, HTMLDivElement | null>,
) {
  for (let index = 0; index < lists.length; index += 1) {
    const element = columnRefs.get(lists[index].id);
    if (!element) continue;
    const rect = element.getBoundingClientRect();
    if (clientX < rect.left + rect.width / 2) {
      return index;
    }
  }
  return Math.max(0, lists.length - 1);
}

export function BoardCanvas() {
  const lists = useBoardStore((s) => s.lists);
  const canEdit = useBoardStore((s) => s.canEdit);
  const addList = useAddListMutation();
  const reorderLists = useReorderListsMutation();
  const commitListsLayout = useCommitListsLayoutMutation();
  const editable = canEdit();

  const [displayLists, setDisplayLists] = useState(lists);
  const [draggingListId, setDraggingListId] = useState<string | null>(null);
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [addColumnKey, setAddColumnKey] = useState(0);
  const [addColumnError, setAddColumnError] = useState<string | null>(null);
  const columnRefs = useRef(new Map<string, HTMLDivElement | null>());
  const draggingListIdRef = useRef<string | null>(null);
  const displayListsRef = useRef(lists);

  useEffect(() => {
    registerCardLayoutCommit((updates) => commitListsLayout.mutateAsync(updates));
  }, [commitListsLayout.mutateAsync]);

  useEffect(() => {
    displayListsRef.current = displayLists;
  }, [displayLists]);

  useEffect(() => {
    if (!draggingListIdRef.current) {
      displayListsRef.current = lists;
      setDisplayLists(lists);
    }
  }, [lists]);

  async function onConfirmAddColumn(title: string) {
    setAddColumnError(null);
    try {
      await addList.mutateAsync(title);
      setAddColumnOpen(false);
    } catch (err) {
      setAddColumnError(
        err instanceof Error ? err.message : "Failed to create column",
      );
    }
  }

  function endListDrag() {
    const orderedIds = displayListsRef.current.map((list) => list.id);
    const storeLists = useBoardStore.getState().lists;
    const currentIds = storeLists.map((list) => list.id);

    draggingListIdRef.current = null;
    setDraggingListId(null);

    if (orderedIds.join() !== currentIds.join()) {
      reorderLists.mutate(orderedIds);
      return;
    }

    displayListsRef.current = storeLists;
    setDisplayLists(storeLists);
  }

  function onGripPointerDown(
    listId: string,
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    if (!editable) return;
    event.preventDefault();
    draggingListIdRef.current = listId;
    setDraggingListId(listId);

    const pointerId = event.pointerId;
    let finished = false;

    const handleMove = (moveEvent: PointerEvent) => {
      if (finished || moveEvent.pointerId !== pointerId) return;
      const draggedId = draggingListIdRef.current;
      if (!draggedId) return;
      const next = reorderListsLocal(
        displayListsRef.current,
        draggedId,
        getTargetIndex(
          moveEvent.clientX,
          displayListsRef.current,
          columnRefs.current,
        ),
      );
      displayListsRef.current = next;
      setDisplayLists(next);
    };

    const finishDrag = (endEvent: PointerEvent) => {
      if (finished || endEvent.pointerId !== pointerId) return;
      finished = true;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
      endListDrag();
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto p-4">
        <div className="flex min-h-full items-start gap-4">
          <div className="flex h-full min-h-0 items-start gap-4">
            {displayLists.map((list) => (
              <ListColumn
                key={list.id}
                list={list}
                columnRef={(element) => {
                  columnRefs.current.set(list.id, element);
                }}
                isDragging={draggingListId === list.id}
                onGripPointerDown={(event) => onGripPointerDown(list.id, event)}
              />
            ))}
          </div>
          {editable && (
            <button
              type="button"
              onClick={() => {
                setAddColumnError(null);
                setAddColumnKey((key) => key + 1);
                setAddColumnOpen(true);
              }}
              className="inline-flex w-72 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/30 bg-white/10 px-4 py-3 text-left text-sm text-white/90 transition hover:bg-white/15"
            >
              <PlusIcon size={18} color="currentColor" />
              Add column
            </button>
          )}
        </div>
      </div>

      <PromptModal
        key={addColumnKey}
        open={addColumnOpen}
        title="Add column"
        label="Column name"
        placeholder="e.g. In progress"
        confirmLabel="Add column"
        error={addColumnError}
        loading={addList.isPending}
        onConfirm={(title) => void onConfirmAddColumn(title)}
        onCancel={() => {
          if (!addList.isPending) {
            setAddColumnOpen(false);
            setAddColumnError(null);
          }
        }}
      />
    </div>
  );
}
