import type {
  DragendEventData,
  ParentConfig,
  TransferEventData,
} from "@formkit/drag-and-drop";
import type { Card } from "@/lib/types";

type ListLayoutUpdate = { listId: string; cardIds: string[] };
type CommitLayout = (updates: ListLayoutUpdate[]) => Promise<void>;

let commitLayout: CommitLayout = async () => {};
let dndLock = 0;
let skipNextDragend = false;

export function registerCardLayoutCommit(fn: CommitLayout) {
  commitLayout = fn;
}

export function isCardDndActive() {
  return dndLock > 0;
}

function lockDnd() {
  dndLock += 1;
}

function unlockDnd() {
  dndLock = Math.max(0, dndLock - 1);
}

function listIdFromParent(el: HTMLElement) {
  return el.dataset.listId ?? "";
}

export const cardDndConfig: Partial<ParentConfig<Card>> = {
  group: "cards",
  draggable: (el) => el instanceof HTMLElement && el.tagName === "LI",
  onDragstart: () => {
    lockDnd();
  },
  onDragend: (data: DragendEventData<Card>) => {
    if (skipNextDragend) return;
    void (async () => {
      try {
        const listId = listIdFromParent(data.parent.el);
        if (!listId) return;
        await commitLayout([
          { listId, cardIds: data.values.map((c) => c.id) },
        ]);
      } finally {
        unlockDnd();
      }
    })();
  },
  onTransfer: (data: TransferEventData<Card>) => {
    skipNextDragend = true;
    void (async () => {
      try {
        const sourceListId = listIdFromParent(data.sourceParent.el);
        const targetListId = listIdFromParent(data.targetParent.el);
        if (!sourceListId || !targetListId) return;

        const sourceIds = (
          data.sourceParent.data.getValues(data.sourceParent.el) as Card[]
        ).map((c) => c.id);
        const targetIds = (
          data.targetParent.data.getValues(data.targetParent.el) as Card[]
        ).map((c) => c.id);

        await commitLayout([
          { listId: sourceListId, cardIds: sourceIds },
          { listId: targetListId, cardIds: targetIds },
        ]);
      } finally {
        unlockDnd();
        requestAnimationFrame(() => {
          skipNextDragend = false;
        });
      }
    })();
  },
};
