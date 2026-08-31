import { consumeLocalMutation } from "@/lib/local-mutation-tracker";
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

function memberName(members: BoardMember[], userId: string) {
  const member = members.find((m) => m.user_id === userId);
  return member?.profile?.display_name || member?.profile?.email || "Someone";
}

function cardTitle(cards: Card[], cardId: string) {
  return cards.find((c) => c.id === cardId)?.title ?? "a card";
}

function listTitle(lists: List[], listId: string) {
  return lists.find((l) => l.id === listId)?.title ?? "a list";
}

function labelName(labels: Label[], labelId: string) {
  return labels.find((l) => l.id === labelId)?.name ?? "a label";
}

export type BoardChangeNotification =
  | { kind: "toast"; message: string }
  | { kind: "debounced-toast"; key: string; message: string };

export function describeBoardChange(
  payload: RealtimePayload,
  state: BoardSnapshot,
  userId: string,
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
      return { kind: "toast", message: `Board renamed to “${newTitle}”` };
    }
    if (newBackground && currentBoard.background_color !== newBackground) {
      return { kind: "toast", message: "Board background updated" };
    }
    return null;
  }

  if (table === "lists") {
    const id = row.id as string;
    if (consumeLocalMutation(`lists:${id}`)) return null;
    const title = row.title as string;
    if (eventType === "INSERT") {
      return { kind: "toast", message: `List added: “${title}”` };
    }
    if (eventType === "DELETE") {
      const existing = state.lists.find((l) => l.id === id);
      return {
        kind: "toast",
        message: `List removed: “${existing?.title ?? title}”`,
      };
    }
    const existing = state.lists.find((l) => l.id === id);
    if (!existing) return { kind: "toast", message: `List updated: “${title}”` };
    if (existing.title !== title) {
      return { kind: "toast", message: `List renamed to “${title}”` };
    }
    if (existing.position !== row.position) {
      return { kind: "debounced-toast", key: "lists-reorder", message: "Lists reordered" };
    }
    return null;
  }

  if (table === "cards") {
    const id = row.id as string;
    if (consumeLocalMutation(`cards:${id}`)) return null;
    const title = row.title as string;
    if (eventType === "INSERT") {
      return { kind: "toast", message: `Card added: “${title}”` };
    }
    if (eventType === "DELETE") {
      const existing = state.cards.find((c) => c.id === id);
      return {
        kind: "toast",
        message: `Card removed: “${existing?.title ?? title}”`,
      };
    }
    const existing = state.cards.find((c) => c.id === id);
    if (!existing) return { kind: "toast", message: `Card updated: “${title}”` };
    if (existing.title !== title) {
      return { kind: "toast", message: `Card renamed to “${title}”` };
    }
    if (existing.list_id !== row.list_id) {
      const listName = listTitle(state.lists, row.list_id as string);
      return {
        kind: "toast",
        message: `“${existing.title}” moved to “${listName}”`,
      };
    }
    if (
      existing.description !== row.description ||
      existing.due_date !== row.due_date
    ) {
      return { kind: "toast", message: `Card updated: “${existing.title}”` };
    }
    if (existing.position !== row.position) {
      const listName = listTitle(state.lists, existing.list_id);
      return {
        kind: "debounced-toast",
        key: `cards-reorder:${existing.list_id}`,
        message: `Cards reordered in “${listName}”`,
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
    const title = cardTitle(state.cards, cardId);
    const author = memberName(state.members, authorId);
    if (eventType === "INSERT") {
      return { kind: "toast", message: `${author} commented on “${title}”` };
    }
    if (eventType === "UPDATE") {
      return { kind: "toast", message: `${author} edited a comment on “${title}”` };
    }
    return { kind: "toast", message: `${author} deleted a comment on “${title}”` };
  }

  if (table === "labels") {
    const id = row.id as string;
    if (consumeLocalMutation(`labels:${id}`)) return null;
    const name = row.name as string;
    if (eventType === "INSERT") {
      return { kind: "toast", message: `Label added: “${name}”` };
    }
    if (eventType === "DELETE") {
      const existing = state.labels.find((l) => l.id === id);
      return {
        kind: "toast",
        message: `Label removed: “${existing?.name ?? name}”`,
      };
    }
    return { kind: "toast", message: `Label updated: “${name}”` };
  }

  if (table === "card_labels") {
    const cardId = row.card_id as string;
    const labelId = row.label_id as string;
    if (consumeLocalMutation(`card_labels:${cardId}:${labelId}`)) return null;
    const title = cardTitle(state.cards, cardId);
    const name = labelName(state.labels, labelId);
    if (eventType === "INSERT") {
      return { kind: "toast", message: `“${name}” added to “${title}”` };
    }
    return { kind: "toast", message: `“${name}” removed from “${title}”` };
  }

  if (table === "card_assignees") {
    const cardId = row.card_id as string;
    const assigneeId = row.user_id as string;
    if (consumeLocalMutation(`card_assignees:${cardId}:${assigneeId}`)) {
      return null;
    }
    const title = cardTitle(state.cards, cardId);
    const name = memberName(state.members, assigneeId);
    if (eventType === "INSERT") {
      return { kind: "toast", message: `${name} assigned to “${title}”` };
    }
    return { kind: "toast", message: `${name} unassigned from “${title}”` };
  }

  if (table === "board_members") {
    const memberId = row.user_id as string;
    if (consumeLocalMutation(`board_members:${memberId}`)) return null;
    const name = memberName(state.members, memberId);
    if (eventType === "INSERT") {
      if (memberId === userId) return null;
      return { kind: "toast", message: `${name} joined the board` };
    }
    if (eventType === "DELETE") {
      return { kind: "toast", message: `${name} left the board` };
    }
    const role = row.role as string;
    if (memberId === userId) {
      return { kind: "toast", message: `You are now ${role}` };
    }
    return { kind: "toast", message: `${name} is now ${role}` };
  }

  return null;
}
