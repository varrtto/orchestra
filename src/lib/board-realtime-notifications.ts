import { consumeLocalMutation } from "@/lib/local-mutation-tracker";
import type { Translator } from "@/lib/i18n";
import type {
  Board,
  BoardMember,
  Card,
  Comment,
  Label,
  List,
} from "@/lib/types";

type BoardSnapshot = {
  board: Board | null;
  lists: List[];
  cards: Card[];
  labels: Label[];
  members: BoardMember[];
  comments: Comment[];
};

type RealtimePayload = {
  table: string;
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown> | null;
  old: Record<string, unknown> | null;
};

function memberName(
  members: BoardMember[],
  userId: string,
  t: Translator,
) {
  const member = members.find((m) => m.user_id === userId);
  return member?.profile?.display_name || member?.profile?.email || t("common.someone");
}

function cardTitle(cards: Card[], cardId: string, t: Translator) {
  return cards.find((c) => c.id === cardId)?.title ?? t("common.aCard");
}

function listTitle(lists: List[], listId: string, t: Translator) {
  return lists.find((l) => l.id === listId)?.title ?? t("common.aList");
}

function labelName(labels: Label[], labelId: string, t: Translator) {
  return labels.find((l) => l.id === labelId)?.name ?? t("common.aLabel");
}

function roleLabel(role: string, t: Translator) {
  if (role === "owner") return t("roles.owner");
  if (role === "editor") return t("roles.editor");
  if (role === "viewer") return t("roles.viewer");
  return role;
}

export type BoardChangeNotification =
  | { kind: "toast"; message: string }
  | { kind: "debounced-toast"; key: string; message: string };

export function describeBoardChange(
  payload: RealtimePayload,
  state: BoardSnapshot,
  userId: string,
  t: Translator,
): BoardChangeNotification | null {
  const { table, eventType } = payload;
  const row = (eventType === "DELETE" ? payload.old : payload.new) as Record<
    string,
    unknown
  > | null;
  if (!row) return null;

  if (table === "boards" && eventType === "UPDATE") {
    const id = row.id as string;
    if (consumeLocalMutation(`boards:${id}`)) return null;

    const currentBoard = state.board;
    if (!currentBoard || currentBoard.id !== id) return null;

    const newTitle = row.title as string | undefined;
    const newBackground = row.background_color as string | undefined;

    if (newTitle && currentBoard.title !== newTitle) {
      return {
        kind: "toast",
        message: t("realtime.boardRenamed", { title: newTitle }),
      };
    }
    if (newBackground && currentBoard.background_color !== newBackground) {
      return { kind: "toast", message: t("realtime.boardBackgroundUpdated") };
    }
    return null;
  }

  if (table === "lists") {
    const id = row.id as string;
    if (consumeLocalMutation(`lists:${id}`)) return null;
    const title = row.title as string;
    if (eventType === "INSERT") {
      return {
        kind: "toast",
        message: t("realtime.listAdded", { title }),
      };
    }
    if (eventType === "DELETE") {
      const existing = state.lists.find((l) => l.id === id);
      return {
        kind: "toast",
        message: t("realtime.listRemoved", {
          title: existing?.title ?? title,
        }),
      };
    }
    const existing = state.lists.find((l) => l.id === id);
    if (!existing) {
      return {
        kind: "toast",
        message: t("realtime.listUpdated", { title }),
      };
    }
    if (existing.title !== title) {
      return {
        kind: "toast",
        message: t("realtime.listRenamed", { title }),
      };
    }
    if (existing.position !== row.position) {
      return {
        kind: "debounced-toast",
        key: "lists-reorder",
        message: t("realtime.listsReordered"),
      };
    }
    return null;
  }

  if (table === "cards") {
    const id = row.id as string;
    if (consumeLocalMutation(`cards:${id}`)) return null;
    const title = row.title as string;
    if (eventType === "INSERT") {
      return {
        kind: "toast",
        message: t("realtime.cardAdded", { title }),
      };
    }
    if (eventType === "DELETE") {
      const existing = state.cards.find((c) => c.id === id);
      return {
        kind: "toast",
        message: t("realtime.cardRemoved", {
          title: existing?.title ?? title,
        }),
      };
    }
    const existing = state.cards.find((c) => c.id === id);
    if (!existing) {
      return {
        kind: "toast",
        message: t("realtime.cardUpdated", { title }),
      };
    }
    if (existing.title !== title) {
      return {
        kind: "toast",
        message: t("realtime.cardRenamed", { title }),
      };
    }
    if (existing.list_id !== row.list_id) {
      const listName = listTitle(state.lists, row.list_id as string, t);
      return {
        kind: "toast",
        message: t("realtime.cardMoved", {
          title: existing.title,
          list: listName,
        }),
      };
    }
    if (
      existing.description !== row.description ||
      existing.due_date !== row.due_date
    ) {
      return {
        kind: "toast",
        message: t("realtime.cardUpdated", { title: existing.title }),
      };
    }
    if (existing.position !== row.position) {
      const listName = listTitle(state.lists, existing.list_id, t);
      return {
        kind: "debounced-toast",
        key: `cards-reorder:${existing.list_id}`,
        message: t("realtime.cardsReordered", { list: listName }),
      };
    }
    return null;
  }

  if (table === "comments") {
    const id = row.id as string;
    const authorId = row.author_id as string;
    if (authorId === userId || consumeLocalMutation(`comments:${id}`)) {
      return null;
    }
    const cardId = row.card_id as string;
    const title = cardTitle(state.cards, cardId, t);
    const author = memberName(state.members, authorId, t);
    if (eventType === "INSERT") {
      return {
        kind: "toast",
        message: t("realtime.commented", { author, title }),
      };
    }
    if (eventType === "UPDATE") {
      return {
        kind: "toast",
        message: t("realtime.commentEdited", { author, title }),
      };
    }
    return {
      kind: "toast",
      message: t("realtime.commentDeleted", { author, title }),
    };
  }

  if (table === "labels") {
    const id = row.id as string;
    if (consumeLocalMutation(`labels:${id}`)) return null;
    const name = row.name as string;
    if (eventType === "INSERT") {
      return {
        kind: "toast",
        message: t("realtime.labelAdded", { name }),
      };
    }
    if (eventType === "DELETE") {
      const existing = state.labels.find((l) => l.id === id);
      return {
        kind: "toast",
        message: t("realtime.labelRemoved", {
          name: existing?.name ?? name,
        }),
      };
    }
    return {
      kind: "toast",
      message: t("realtime.labelUpdated", { name }),
    };
  }

  if (table === "card_labels") {
    const cardId = row.card_id as string;
    const labelId = row.label_id as string;
    if (consumeLocalMutation(`card_labels:${cardId}:${labelId}`)) return null;
    const title = cardTitle(state.cards, cardId, t);
    const name = labelName(state.labels, labelId, t);
    if (eventType === "INSERT") {
      return {
        kind: "toast",
        message: t("realtime.labelOnCard", { name, title }),
      };
    }
    return {
      kind: "toast",
      message: t("realtime.labelOffCard", { name, title }),
    };
  }

  if (table === "card_assignees") {
    const cardId = row.card_id as string;
    const assigneeId = row.user_id as string;
    if (consumeLocalMutation(`card_assignees:${cardId}:${assigneeId}`)) {
      return null;
    }
    const title = cardTitle(state.cards, cardId, t);
    const name = memberName(state.members, assigneeId, t);
    if (eventType === "INSERT") {
      return {
        kind: "toast",
        message: t("realtime.assigned", { name, title }),
      };
    }
    return {
      kind: "toast",
      message: t("realtime.unassigned", { name, title }),
    };
  }

  if (table === "board_members") {
    const memberId = row.user_id as string;
    if (consumeLocalMutation(`board_members:${memberId}`)) return null;
    const name = memberName(state.members, memberId, t);
    if (eventType === "INSERT") {
      if (memberId === userId) return null;
      return {
        kind: "toast",
        message: t("realtime.memberJoined", { name }),
      };
    }
    if (eventType === "DELETE") {
      return {
        kind: "toast",
        message: t("realtime.memberLeft", { name }),
      };
    }
    const role = roleLabel(row.role as string, t);
    if (memberId === userId) {
      return { kind: "toast", message: t("realtime.youAreNow", { role }) };
    }
    return {
      kind: "toast",
      message: t("realtime.memberIsNow", { name, role }),
    };
  }

  return null;
}
