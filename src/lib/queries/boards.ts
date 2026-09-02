import { createClient } from "@/lib/supabase/client";
import { randomBoardBackgroundColor } from "@/lib/board-background";
import { normalizeCards } from "@/lib/normalize-card";
import type {
  BoardMember,
  BoardRole,
  BoardWithRole,
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

export const queryKeys = {
  boards: ["boards"] as const,
  board: (boardId: string) => ["boards", boardId] as const,
};

export async function fetchBoards(): Promise<BoardWithRole[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  await supabase.rpc("ensure_profile");
  await supabase.rpc("claim_invites");

  const { data: memberships, error } = await supabase
    .from("board_members")
    .select("role, boards(*)")
    .eq("user_id", user.id);

  if (error) throw error;
  if (!memberships) return [];

  return memberships
    .map((m) => {
      const board = m.boards as unknown as {
        id: string;
        title: string;
        background_color: string;
        created_by: string;
        created_at: string;
        updated_at: string;
      } | null;
      if (!board) return null;
      return { ...board, role: m.role as BoardRole };
    })
    .filter((b): b is BoardWithRole => Boolean(b))
    .sort((a, b) => {
      const byUpdated =
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      if (byUpdated !== 0) return byUpdated;
      return a.title.localeCompare(b.title);
    });
}

export async function fetchBoard(boardId: string): Promise<FullBoard> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.rpc("ensure_profile");
  await supabase.rpc("claim_invites");

  const { data: membership } = await supabase
    .from("board_members")
    .select("role")
    .eq("board_id", boardId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) throw new Error("Board not found or access denied");

  const [boardRes, listsRes, membersRes, labelsRes, invitesRes] = await Promise.all([
    supabase.from("boards").select("*").eq("id", boardId).single(),
    supabase
      .from("lists")
      .select("*")
      .eq("board_id", boardId)
      .order("position"),
    supabase
      .from("board_members")
      .select("board_id, user_id, role, created_at, profiles(*)")
      .eq("board_id", boardId),
    supabase.from("labels").select("*").eq("board_id", boardId),
    supabase
      .from("invites")
      .select("*")
      .eq("board_id", boardId)
      .eq("status", "pending")
      .order("created_at"),
  ]);

  if (boardRes.error || !boardRes.data) throw boardRes.error ?? new Error("Board missing");
  if (invitesRes.error) throw invitesRes.error;

  const lists = (listsRes.data ?? []) as List[];
  const listIds = lists.map((l) => l.id);

  let cards: Card[] = [];
  let cardLabels: CardLabel[] = [];
  let cardAssignees: CardAssignee[] = [];
  let comments: Comment[] = [];

  if (listIds.length > 0) {
    const { data: cardsData, error: cardsError } = await supabase
      .from("cards")
      .select("*")
      .in("list_id", listIds)
      .order("position");
    if (cardsError) throw cardsError;
    cards = normalizeCards((cardsData ?? []) as Card[]);
    const cardIds = cards.map((c) => c.id);

    if (cardIds.length > 0) {
      const [labelsJoin, assigneesJoin, commentsJoin] = await Promise.all([
        supabase.from("card_labels").select("*").in("card_id", cardIds),
        supabase
          .from("card_assignees")
          .select("card_id, user_id, profiles(*)")
          .in("card_id", cardIds),
        supabase
          .from("comments")
          .select("*, profiles(*)")
          .in("card_id", cardIds)
          .order("created_at"),
      ]);

      if (labelsJoin.error) throw labelsJoin.error;
      if (assigneesJoin.error) throw assigneesJoin.error;
      if (commentsJoin.error) throw commentsJoin.error;

      cardLabels = (labelsJoin.data ?? []) as CardLabel[];
      cardAssignees = (assigneesJoin.data ?? []).map((row) => ({
        card_id: row.card_id as string,
        user_id: row.user_id as string,
        profile: row.profiles as unknown as Profile | undefined,
      }));
      comments = (commentsJoin.data ?? []).map((row) => {
        const { profiles, ...rest } = row as Comment & {
          profiles: Profile | null;
        };
        return { ...rest, author: profiles ?? undefined };
      });
    }
  }

  const members: BoardMember[] = (membersRes.data ?? []).map((m) => ({
    board_id: m.board_id as string,
    user_id: m.user_id as string,
    role: m.role as BoardRole,
    created_at: m.created_at as string,
    profile: m.profiles as unknown as Profile | undefined,
  }));

  return {
    board: boardRes.data,
    role: membership.role as BoardRole,
    lists,
    cards,
    labels: (labelsRes.data ?? []) as Label[],
    cardLabels,
    cardAssignees,
    comments,
    members,
    invites: (invitesRes.data ?? []) as Invite[],
  };
}

export async function createBoard(title: string) {
  const supabase = createClient();
  await supabase.rpc("ensure_profile");
  const { data, error } = await supabase.rpc("create_board", {
    p_title: title,
    p_background_color: randomBoardBackgroundColor(),
  });
  if (error) throw error;
  return data;
}

export async function deleteBoard(boardId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("boards").delete().eq("id", boardId);
  if (error) throw error;
}
