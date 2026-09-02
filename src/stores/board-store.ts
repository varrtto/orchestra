"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { markLocalMutation } from "@/lib/local-mutation-tracker";
import { isValidBoardBackgroundColor } from "@/lib/board-background";
import { normalizeCard } from "@/lib/normalize-card";
import { nextPosition, reindexPositions } from "@/lib/position";
import type {
  Board,
  BoardMember,
  BoardRole,
  Card,
  CardAssignee,
  CardLabel,
  Comment,
  FullBoard,
  Invite,
  Label,
  List,
  Profile,
} from "@/lib/types";

type BoardState = {
  board: Board | null;
  role: BoardRole | null;
  lists: List[];
  cards: Card[];
  labels: Label[];
  cardLabels: CardLabel[];
  cardAssignees: CardAssignee[];
  comments: Comment[];
  members: BoardMember[];
  invites: Invite[];
  currentUserId: string | null;
  selectedCardId: string | null;
  loading: boolean;
  error: string | null;

  hydrate: (data: FullBoard, userId: string) => void;
  setSelectedCardId: (id: string | null) => void;
  canEdit: () => boolean;

  addList: (title: string) => Promise<void>;
  renameList: (listId: string, title: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  reorderLists: (orderedIds: string[]) => Promise<void>;

  addCard: (listId: string, title: string) => Promise<void>;
  updateCard: (
    cardId: string,
    patch: Partial<Pick<Card, "title" | "description" | "due_date" | "list_id" | "position">>,
  ) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  persistCardOrder: (listId: string, orderedCardIds: string[]) => Promise<void>;
  commitListsLayout: (
    updates: { listId: string; cardIds: string[] }[],
  ) => Promise<void>;
  moveCardBetweenLists: (
    cardId: string,
    fromListId: string,
    toListId: string,
    toOrderedIds: string[],
    fromOrderedIds: string[],
  ) => Promise<void>;

  toggleLabel: (cardId: string, labelId: string) => Promise<void>;
  toggleAssignee: (cardId: string, userId: string) => Promise<void>;

  addComment: (cardId: string, body: string) => Promise<void>;
  updateComment: (commentId: string, body: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;

  inviteMember: (email: string, role: BoardRole) => Promise<Invite>;
  revokeInvite: (inviteId: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateMemberRole: (userId: string, role: BoardRole) => Promise<void>;
  transferOwnership: (newOwnerId: string) => Promise<void>;
  renameBoard: (title: string) => Promise<void>;
  updateBoardBackgroundColor: (backgroundColor: string) => Promise<void>;
  leaveBoard: () => Promise<void>;
  deleteBoard: () => Promise<void>;

  applyRealtimeBoard: (board: Board, event: "UPDATE") => void;
  applyRealtimeMember: (
    member: BoardMember,
    event: "INSERT" | "UPDATE" | "DELETE",
  ) => void;
  applyRealtimeList: (list: List, event: "INSERT" | "UPDATE" | "DELETE") => void;
  applyRealtimeCard: (card: Card, event: "INSERT" | "UPDATE" | "DELETE") => void;
  applyRealtimeComment: (
    comment: Comment,
    event: "INSERT" | "UPDATE" | "DELETE",
  ) => void;
  applyRealtimeLabel: (label: Label, event: "INSERT" | "UPDATE" | "DELETE") => void;
  applyRealtimeCardLabel: (
    row: CardLabel,
    event: "INSERT" | "DELETE",
  ) => void;
  applyRealtimeCardAssignee: (
    row: CardAssignee,
    event: "INSERT" | "DELETE",
  ) => void;
};

function sortByPosition<T extends { position: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.position - b.position);
}

export const useBoardStore = create<BoardState>((set, get) => ({
  board: null,
  role: null,
  lists: [],
  cards: [],
  labels: [],
  cardLabels: [],
  cardAssignees: [],
  comments: [],
  members: [],
  invites: [],
  currentUserId: null,
  selectedCardId: null,
  loading: false,
  error: null,

  hydrate: (data, userId) =>
    set({
      board: data.board,
      role: data.role,
      lists: sortByPosition(data.lists),
      cards: sortByPosition(data.cards),
      labels: data.labels,
      cardLabels: data.cardLabels,
      cardAssignees: data.cardAssignees,
      comments: data.comments,
      members: data.members,
      invites: data.invites,
      currentUserId: userId,
      loading: false,
      error: null,
    }),

  setSelectedCardId: (id) => set({ selectedCardId: id }),

  canEdit: () => {
    const role = get().role;
    return role === "owner" || role === "editor";
  },

  addList: async (title) => {
    const { board, lists, canEdit } = get();
    if (!board || !canEdit()) return;
    const supabase = createClient();
    const position = nextPosition(lists);
    const { data, error } = await supabase
      .from("lists")
      .insert({ board_id: board.id, title, position })
      .select()
      .single();
    if (error) throw error;
    markLocalMutation(`lists:${(data as List).id}`);
    set({ lists: sortByPosition([...get().lists, data as List]) });
  },

  renameList: async (listId, title) => {
    if (!get().canEdit()) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("lists")
      .update({ title })
      .eq("id", listId);
    if (error) throw error;
    markLocalMutation(`lists:${listId}`);
    set({
      lists: get().lists.map((l) => (l.id === listId ? { ...l, title } : l)),
    });
  },

  deleteList: async (listId) => {
    if (!get().canEdit()) return;
    const supabase = createClient();
    const { error } = await supabase.from("lists").delete().eq("id", listId);
    if (error) throw error;
    markLocalMutation(`lists:${listId}`);
    set({
      lists: get().lists.filter((l) => l.id !== listId),
      cards: get().cards.filter((c) => c.list_id !== listId),
    });
  },

  reorderLists: async (orderedIds) => {
    if (!get().canEdit()) return;
    const currentIds = get().lists.map((list) => list.id);
    if (orderedIds.join() === currentIds.join()) return;

    const byId = new Map(get().lists.map((l) => [l.id, l]));
    const reordered = reindexPositions(
      orderedIds
        .map((id) => byId.get(id))
        .filter((l): l is List => Boolean(l)),
    );
    if (reordered.length !== orderedIds.length) return;

    const previousLists = get().lists;
    set({ lists: reordered });
    const supabase = createClient();
    for (const list of reordered) {
      markLocalMutation(`lists:${list.id}`);
    }
    const results = await Promise.all(
      reordered.map((l) =>
        supabase.from("lists").update({ position: l.position }).eq("id", l.id),
      ),
    );
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      set({ lists: previousLists });
      throw failed.error;
    }
  },

  addCard: async (listId, title) => {
    if (!get().canEdit()) return;
    const listCards = get().cards.filter((c) => c.list_id === listId);
    const position = nextPosition(listCards);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("cards")
      .insert({ list_id: listId, title, position })
      .select()
      .single();
    if (error) throw error;
    const card = normalizeCard(data as Card);
    markLocalMutation(`cards:${card.id}`);
    set({ cards: sortByPosition([...get().cards, card]) });
  },

  updateCard: async (cardId, patch) => {
    if (!get().canEdit()) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("cards")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", cardId);
    if (error) throw error;
    markLocalMutation(`cards:${cardId}`);
    set({
      cards: sortByPosition(
        get().cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
      ),
    });
  },

  deleteCard: async (cardId) => {
    if (!get().canEdit()) return;
    const supabase = createClient();
    const { error } = await supabase.from("cards").delete().eq("id", cardId);
    if (error) throw error;
    markLocalMutation(`cards:${cardId}`);
    set({
      cards: get().cards.filter((c) => c.id !== cardId),
      cardLabels: get().cardLabels.filter((cl) => cl.card_id !== cardId),
      cardAssignees: get().cardAssignees.filter((ca) => ca.card_id !== cardId),
      comments: get().comments.filter((cm) => cm.card_id !== cardId),
      selectedCardId:
        get().selectedCardId === cardId ? null : get().selectedCardId,
    });
  },

  persistCardOrder: async (listId, orderedCardIds) => {
    await get().commitListsLayout([{ listId, cardIds: orderedCardIds }]);
  },

  commitListsLayout: async (updates) => {
    if (!get().canEdit() || updates.length === 0) return;

    const updateMap = new Map(updates.map((u) => [u.listId, u.cardIds]));
    const byId = new Map(get().cards.map((c) => [c.id, c]));
    const untouched = get().cards.filter((c) => !updateMap.has(c.list_id));

    const updated: Card[] = [];
    for (const [listId, cardIds] of updateMap) {
      const listCards = cardIds
        .map((id) => byId.get(id))
        .filter((c): c is Card => Boolean(c))
        .map((c) => ({ ...c, list_id: listId }));
      updated.push(...reindexPositions(listCards));
    }

    set({ cards: sortByPosition([...untouched, ...updated]) });

    for (const card of updated) {
      markLocalMutation(`cards:${card.id}`);
    }

    const supabase = createClient();
    await Promise.all(
      updated.map((c) =>
        supabase
          .from("cards")
          .update({ list_id: c.list_id, position: c.position })
          .eq("id", c.id),
      ),
    );
  },

  moveCardBetweenLists: async (
    cardId,
    fromListId,
    toListId,
    toOrderedIds,
    fromOrderedIds,
  ) => {
    await get().commitListsLayout([
      { listId: fromListId, cardIds: fromOrderedIds },
      { listId: toListId, cardIds: toOrderedIds },
    ]);
  },

  toggleLabel: async (cardId, labelId) => {
    if (!get().canEdit()) return;
    const supabase = createClient();
    const exists = get().cardLabels.some(
      (cl) => cl.card_id === cardId && cl.label_id === labelId,
    );
    if (exists) {
      markLocalMutation(`card_labels:${cardId}:${labelId}`);
      await supabase
        .from("card_labels")
        .delete()
        .eq("card_id", cardId)
        .eq("label_id", labelId);
      set({
        cardLabels: get().cardLabels.filter(
          (cl) => !(cl.card_id === cardId && cl.label_id === labelId),
        ),
      });
    } else {
      markLocalMutation(`card_labels:${cardId}:${labelId}`);
      await supabase.from("card_labels").insert({ card_id: cardId, label_id: labelId });
      set({
        cardLabels: [...get().cardLabels, { card_id: cardId, label_id: labelId }],
      });
    }
  },

  toggleAssignee: async (cardId, userId) => {
    if (!get().canEdit()) {
      throw new Error("Only board owners and editors can change assignees");
    }
    const supabase = createClient();
    const exists = get().cardAssignees.some(
      (ca) => ca.card_id === cardId && ca.user_id === userId,
    );
    if (exists) {
      markLocalMutation(`card_assignees:${cardId}:${userId}`);
      const { error } = await supabase
        .from("card_assignees")
        .delete()
        .eq("card_id", cardId)
        .eq("user_id", userId);
      if (error) throw error;
      set({
        cardAssignees: get().cardAssignees.filter(
          (ca) => !(ca.card_id === cardId && ca.user_id === userId),
        ),
      });
      return;
    }

    const member = get().members.find((m) => m.user_id === userId);
    markLocalMutation(`card_assignees:${cardId}:${userId}`);
    const { error } = await supabase
      .from("card_assignees")
      .insert({ card_id: cardId, user_id: userId });
    if (error) throw error;
    set({
      cardAssignees: [
        ...get().cardAssignees,
        { card_id: cardId, user_id: userId, profile: member?.profile },
      ],
    });
  },

  addComment: async (cardId, body) => {
    if (!get().canEdit()) return;
    const userId = get().currentUserId;
    if (!userId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("comments")
      .insert({ card_id: cardId, author_id: userId, body })
      .select()
      .single();
    if (error) throw error;
    markLocalMutation(`comments:${(data as Comment).id}`);
    const member = get().members.find((m) => m.user_id === userId);
    const comment = {
      ...(data as Comment),
      author: member?.profile,
    };
    set({ comments: [...get().comments, comment] });
  },

  updateComment: async (commentId, body) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("comments")
      .update({ body, updated_at: new Date().toISOString() })
      .eq("id", commentId);
    if (error) throw error;
    markLocalMutation(`comments:${commentId}`);
    set({
      comments: get().comments.map((c) =>
        c.id === commentId ? { ...c, body } : c,
      ),
    });
  },

  deleteComment: async (commentId) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);
    if (error) throw error;
    markLocalMutation(`comments:${commentId}`);
    set({ comments: get().comments.filter((c) => c.id !== commentId) });
  },

  inviteMember: async (email, role) => {
    if (!get().canEdit()) {
      throw new Error("Not allowed to invite members");
    }
    const board = get().board;
    const userId = get().currentUserId;
    if (!board || !userId) {
      throw new Error("Board not loaded");
    }
    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.rpc("upsert_board_invite", {
      p_board_id: board.id,
      p_email: normalizedEmail,
      p_role: role,
    });
    if (error) throw error;
    const invite = data as Invite;
    set({
      invites: [
        ...get().invites.filter((item) => item.id !== invite.id),
        invite,
      ].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    });
    return invite;
  },

  revokeInvite: async (inviteId) => {
    if (!get().canEdit()) return;
    const supabase = createClient();
    const { error } = await supabase.rpc("revoke_board_invite", {
      p_invite_id: inviteId,
    });
    if (error) throw error;
    set({ invites: get().invites.filter((invite) => invite.id !== inviteId) });
  },

  removeMember: async (userId) => {
    if (get().role !== "owner") return;
    const board = get().board;
    if (!board) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("board_members")
      .delete()
      .eq("board_id", board.id)
      .eq("user_id", userId);
    if (error) throw error;
    markLocalMutation(`board_members:${userId}`);
    set({ members: get().members.filter((m) => m.user_id !== userId) });
  },

  updateMemberRole: async (userId, role) => {
    if (get().role !== "owner") return;
    const board = get().board;
    if (!board || role === "owner") return;
    const supabase = createClient();
    const { error } = await supabase
      .from("board_members")
      .update({ role })
      .eq("board_id", board.id)
      .eq("user_id", userId);
    if (error) throw error;
    markLocalMutation(`board_members:${userId}`);
    set({
      members: get().members.map((m) =>
        m.user_id === userId ? { ...m, role } : m,
      ),
    });
  },

  transferOwnership: async (newOwnerId) => {
    if (get().role !== "owner") return;
    const board = get().board;
    const currentUserId = get().currentUserId;
    if (!board || !currentUserId || newOwnerId === currentUserId) return;
    const supabase = createClient();
    const { error } = await supabase.rpc("transfer_board_ownership", {
      p_board_id: board.id,
      p_new_owner_id: newOwnerId,
    });
    if (error) throw error;
    markLocalMutation(`board_members:${newOwnerId}`);
    markLocalMutation(`board_members:${currentUserId}`);
    set({
      role: "editor",
      members: get().members.map((m) => {
        if (m.user_id === newOwnerId) return { ...m, role: "owner" as BoardRole };
        if (m.user_id === currentUserId) return { ...m, role: "editor" as BoardRole };
        return m;
      }),
    });
  },

  renameBoard: async (title) => {
    if (!get().canEdit()) return;
    const board = get().board;
    if (!board) return;
    const trimmed = title.trim();
    if (!trimmed) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("boards")
      .update({ title: trimmed })
      .eq("id", board.id);
    if (error) throw error;
    markLocalMutation(`boards:${board.id}`);
    set({ board: { ...board, title: trimmed } });
  },

  updateBoardBackgroundColor: async (backgroundColor) => {
    if (!get().canEdit()) return;
    const board = get().board;
    if (!board) return;
    if (!isValidBoardBackgroundColor(backgroundColor)) return;
    if (backgroundColor === board.background_color) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("boards")
      .update({ background_color: backgroundColor })
      .eq("id", board.id);
    if (error) throw error;
    markLocalMutation(`boards:${board.id}`);
    set({ board: { ...board, background_color: backgroundColor } });
  },

  leaveBoard: async () => {
    const board = get().board;
    const userId = get().currentUserId;
    if (!board || !userId) return;
    if (get().role === "owner") {
      throw new Error("Transfer ownership or delete the board before leaving");
    }
    const supabase = createClient();
    const { error } = await supabase
      .from("board_members")
      .delete()
      .eq("board_id", board.id)
      .eq("user_id", userId);
    if (error) throw error;
  },

  deleteBoard: async () => {
    if (get().role !== "owner") return;
    const board = get().board;
    if (!board) return;
    const supabase = createClient();
    const { error } = await supabase.from("boards").delete().eq("id", board.id);
    if (error) throw error;
  },

  applyRealtimeBoard: (board, event) => {
    if (event !== "UPDATE" || board.id !== get().board?.id) return;
    const current = get().board!;
    set({ board: { ...current, ...board, key: board.key ?? current.key } });
  },

  applyRealtimeMember: (member, event) => {
    if (member.board_id !== get().board?.id) return;
    if (event === "DELETE") {
      set({ members: get().members.filter((m) => m.user_id !== member.user_id) });
      return;
    }
    const exists = get().members.some((m) => m.user_id === member.user_id);
    if (event === "INSERT" || event === "UPDATE") {
      const existing = get().members.find((m) => m.user_id === member.user_id);
      const merged = { ...member, profile: existing?.profile ?? member.profile };
      set({
        members: exists
          ? get().members.map((m) =>
              m.user_id === member.user_id ? { ...m, ...merged } : m,
            )
          : [...get().members, merged],
      });
      const currentUserId = get().currentUserId;
      if (currentUserId === member.user_id) {
        set({ role: member.role });
      }
      return;
    }
  },

  applyRealtimeList: (list, event) => {
    const boardId = get().board?.id;
    if (!boardId || list.board_id !== boardId) return;
    if (event === "DELETE") {
      set({ lists: get().lists.filter((l) => l.id !== list.id) });
      return;
    }
    const exists = get().lists.some((l) => l.id === list.id);
    if (exists) {
      set({
        lists: sortByPosition(
          get().lists.map((l) => (l.id === list.id ? list : l)),
        ),
      });
    } else {
      set({ lists: sortByPosition([...get().lists, list]) });
    }
  },

  applyRealtimeCard: (card, event) => {
    const normalized = normalizeCard(card);
    const listIds = new Set(get().lists.map((l) => l.id));
    if (event === "DELETE") {
      set({ cards: get().cards.filter((c) => c.id !== normalized.id) });
      return;
    }
    if (
      !listIds.has(normalized.list_id) &&
      !get().cards.some((c) => c.id === normalized.id)
    ) {
      return;
    }
    const exists = get().cards.some((c) => c.id === normalized.id);
    if (exists) {
      set({
        cards: sortByPosition(
          get().cards.map((c) =>
            c.id === normalized.id ? { ...c, ...normalized } : c,
          ),
        ),
      });
    } else {
      set({ cards: sortByPosition([...get().cards, normalized]) });
    }
  },

  applyRealtimeComment: (comment, event) => {
    const cardIds = new Set(get().cards.map((c) => c.id));
    if (event === "DELETE") {
      set({ comments: get().comments.filter((c) => c.id !== comment.id) });
      return;
    }
    if (!cardIds.has(comment.card_id) && !get().comments.some((c) => c.id === comment.id)) {
      return;
    }
    const exists = get().comments.some((c) => c.id === comment.id);
    if (exists) {
      set({
        comments: get().comments.map((c) =>
          c.id === comment.id ? { ...c, ...comment } : c,
        ),
      });
    } else {
      const author = get().members.find((m) => m.user_id === comment.author_id)
        ?.profile;
      set({ comments: [...get().comments, { ...comment, author }] });
    }
  },

  applyRealtimeLabel: (label, event) => {
    if (label.board_id !== get().board?.id) return;
    if (event === "DELETE") {
      set({ labels: get().labels.filter((l) => l.id !== label.id) });
      return;
    }
    const exists = get().labels.some((l) => l.id === label.id);
    set({
      labels: exists
        ? get().labels.map((l) => (l.id === label.id ? label : l))
        : [...get().labels, label],
    });
  },

  applyRealtimeCardLabel: (row, event) => {
    if (event === "DELETE") {
      set({
        cardLabels: get().cardLabels.filter(
          (cl) => !(cl.card_id === row.card_id && cl.label_id === row.label_id),
        ),
      });
      return;
    }
    if (
      !get().cardLabels.some(
        (cl) => cl.card_id === row.card_id && cl.label_id === row.label_id,
      )
    ) {
      set({ cardLabels: [...get().cardLabels, row] });
    }
  },

  applyRealtimeCardAssignee: (row, event) => {
    if (event === "DELETE") {
      set({
        cardAssignees: get().cardAssignees.filter(
          (ca) => !(ca.card_id === row.card_id && ca.user_id === row.user_id),
        ),
      });
      return;
    }
    if (
      !get().cardAssignees.some(
        (ca) => ca.card_id === row.card_id && ca.user_id === row.user_id,
      )
    ) {
      const profile = get().members.find((m) => m.user_id === row.user_id)
        ?.profile;
      set({
        cardAssignees: [...get().cardAssignees, { ...row, profile }],
      });
    }
  },
}));

export type { Profile };
