"use client";

import { BoardCanvas } from "@/components/board/board-canvas";
import { BoardSettingsSidebar } from "@/components/board/board-settings-sidebar";
import { BoardSettingsToggle } from "@/components/board/board-settings-toggle";
import { CardDetailModal } from "@/components/board/card-detail-modal";
import { AppHeader } from "@/components/layout/app-header";
import { CenteredSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useBoardQuery } from "@/hooks/use-boards";
import { DEFAULT_BOARD_BACKGROUND_COLOR } from "@/lib/board-background";
import { describeBoardChange } from "@/lib/board-realtime-notifications";
import { queryKeys } from "@/lib/queries/boards";
import { createClient } from "@/lib/supabase/client";
import type { Board, BoardMember, Card, CardAssignee, CardLabel, Comment, Label, List } from "@/lib/types";
import { useBoardStore } from "@/stores/board-store";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export function BoardPageClient({
  boardId,
  userId,
}: {
  boardId: string;
  userId: string;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, error } = useBoardQuery(boardId);
  const hydrate = useBoardStore((s) => s.hydrate);
  const board = useBoardStore((s) => s.board);
  const selectedCardId = useBoardStore((s) => s.selectedCardId);
  const debouncedToasts = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useLayoutEffect(() => {
    if (data) hydrate(data, userId);
  }, [data, hydrate, userId]);

  useEffect(() => {
    const debouncedToastTimers = debouncedToasts.current;

    const notifyChange = (
      table: string,
      payload: {
        eventType: "INSERT" | "UPDATE" | "DELETE";
        new: Record<string, unknown> | null;
        old: Record<string, unknown> | null;
      },
    ) => {
      const state = useBoardStore.getState();
      const row = (payload.eventType === "DELETE" ? payload.old : payload.new) as
        | Record<string, unknown>
        | null;
      if (!row) return;

      const listIds = new Set(state.lists.map((list) => list.id));
      const cardIds = new Set(state.cards.map((card) => card.id));

      if (
        table === "cards" &&
        !cardIds.has(row.id as string) &&
        !listIds.has(row.list_id as string)
      ) {
        return;
      }

      if (
        (table === "comments" ||
          table === "card_labels" ||
          table === "card_assignees") &&
        !cardIds.has(row.card_id as string)
      ) {
        return;
      }

      const notification = describeBoardChange(
        {
          table,
          eventType: payload.eventType,
          new: payload.new,
          old: payload.old,
        },
        {
          board: state.board,
          lists: state.lists,
          cards: state.cards,
          labels: state.labels,
          members: state.members,
          comments: state.comments,
        },
        userId,
      );

      if (!notification) return;

      if (notification.kind === "toast") {
        toast(notification.message);
        return;
      }

      const existing = debouncedToastTimers.get(notification.key);
      if (existing) clearTimeout(existing);
      debouncedToastTimers.set(
        notification.key,
        setTimeout(() => {
          toast(notification.message);
          debouncedToastTimers.delete(notification.key);
        }, 800),
      );
    };

    const supabase = createClient();
    const channel = supabase
      .channel(`board:${boardId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lists", filter: `board_id=eq.${boardId}` },
        (payload) => {
          const event = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
          notifyChange("lists", {
            eventType: event,
            new: payload.new as Record<string, unknown> | null,
            old: payload.old as Record<string, unknown> | null,
          });
          const row = (
            event === "DELETE" ? payload.old : payload.new
          ) as List;
          useBoardStore.getState().applyRealtimeList(row, event);
          void queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cards" },
        (payload) => {
          const event = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
          notifyChange("cards", {
            eventType: event,
            new: payload.new as Record<string, unknown> | null,
            old: payload.old as Record<string, unknown> | null,
          });
          const row = (
            event === "DELETE" ? payload.old : payload.new
          ) as Card;
          useBoardStore.getState().applyRealtimeCard(row, event);
          void queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        (payload) => {
          const event = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
          notifyChange("comments", {
            eventType: event,
            new: payload.new as Record<string, unknown> | null,
            old: payload.old as Record<string, unknown> | null,
          });
          const row = (
            event === "DELETE" ? payload.old : payload.new
          ) as Comment;
          useBoardStore.getState().applyRealtimeComment(row, event);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "labels", filter: `board_id=eq.${boardId}` },
        (payload) => {
          const event = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
          notifyChange("labels", {
            eventType: event,
            new: payload.new as Record<string, unknown> | null,
            old: payload.old as Record<string, unknown> | null,
          });
          const row = (
            event === "DELETE" ? payload.old : payload.new
          ) as Label;
          useBoardStore.getState().applyRealtimeLabel(row, event);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "card_labels" },
        (payload) => {
          const event = payload.eventType as "INSERT" | "DELETE";
          notifyChange("card_labels", {
            eventType: event,
            new: payload.new as Record<string, unknown> | null,
            old: payload.old as Record<string, unknown> | null,
          });
          const row = (payload.new ?? payload.old) as CardLabel;
          useBoardStore.getState().applyRealtimeCardLabel(row, event);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "boards", filter: `id=eq.${boardId}` },
        (payload) => {
          notifyChange("boards", {
            eventType: "UPDATE",
            new: payload.new as Record<string, unknown>,
            old: payload.old as Record<string, unknown> | null,
          });
          useBoardStore.getState().applyRealtimeBoard(payload.new as Board, "UPDATE");
          void queryClient.invalidateQueries({ queryKey: queryKeys.boards });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "board_members", filter: `board_id=eq.${boardId}` },
        (payload) => {
          const event = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
          notifyChange("board_members", {
            eventType: event,
            new: payload.new as Record<string, unknown> | null,
            old: payload.old as Record<string, unknown> | null,
          });
          const row = (
            event === "DELETE" ? payload.old : payload.new
          ) as BoardMember;
          useBoardStore.getState().applyRealtimeMember(row, event);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "card_assignees" },
        (payload) => {
          const event = payload.eventType as "INSERT" | "DELETE";
          notifyChange("card_assignees", {
            eventType: event,
            new: payload.new as Record<string, unknown> | null,
            old: payload.old as Record<string, unknown> | null,
          });
          const row = (payload.new ?? payload.old) as CardAssignee;
          useBoardStore.getState().applyRealtimeCardAssignee(row, event);
        },
      )
      .subscribe();

    return () => {
      for (const timer of debouncedToastTimers.values()) {
        clearTimeout(timer);
      }
      debouncedToastTimers.clear();
      void supabase.removeChannel(channel);
    };
  }, [boardId, queryClient, toast, userId]);

  const boardTitle = board?.title ?? data?.board.title;
  const boardBackground =
    board?.background_color ??
    data?.board.background_color ??
    DEFAULT_BOARD_BACKGROUND_COLOR;

  if (isLoading) {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <AppHeader backHref="/boards" />
        <CenteredSpinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <AppHeader backHref="/boards" />
        <p className="p-8 text-red-600">
          {error instanceof Error ? error.message : "Unable to load board"}
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex h-dvh min-h-0 flex-col overflow-hidden transition-colors duration-500 ease-in-out"
      style={{ backgroundColor: boardBackground }}
    >
      <AppHeader backHref="/boards" title={boardTitle} />
      <div className="relative flex min-h-0 flex-1">
        <BoardCanvas key={data.board.id} />
        <BoardSettingsToggle
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((value) => !value)}
        />
        <BoardSettingsSidebar open={sidebarOpen} />
      </div>
      {selectedCardId && <CardDetailModal />}
    </div>
  );
}
