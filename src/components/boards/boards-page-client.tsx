"use client";

import { useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Spinner } from "@/components/ui/spinner";
import {
  BoardIcon,
  CrownIcon,
  LayersIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
} from "@/components/ui/icon";
import {
  useBoardsQuery,
  useCreateBoardMutation,
  useDeleteBoardMutation,
} from "@/hooks/use-boards";
import type { BoardWithRole } from "@/lib/types";
import { DEFAULT_BOARD_BACKGROUND_COLOR } from "@/lib/board-background";

export function BoardsPageClient() {
  const { data: boards, isLoading, error, isFetching } = useBoardsQuery();
  const createBoard = useCreateBoardMutation();
  const deleteBoard = useDeleteBoardMutation();
  const [title, setTitle] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<BoardWithRole | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setFormError(null);
    try {
      await createBoard.mutateAsync(trimmed);
      setTitle("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create board");
    }
  }

  async function onConfirmDelete() {
    if (!boardToDelete) return;
    setDeleteError(null);
    try {
      await deleteBoard.mutateAsync(boardToDelete.id);
      setBoardToDelete(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete board",
      );
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 font-display text-3xl text-teal-950">
              <LayersIcon size={28} color="#0f766e" />
              Your boards
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Shared spaces for lists, cards, and comments
            </p>
          </div>
          {isFetching && !isLoading && (
            <span className="text-xs text-slate-400">Refreshing…</span>
          )}
        </div>

        <form
          onSubmit={onCreate}
          className="mb-6 flex flex-col gap-3 rounded-xl border border-teal-900/10 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New board title"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 outline-none ring-teal-600 focus:ring-2"
          />
          <button
            type="submit"
            disabled={createBoard.isPending || !title.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800 disabled:opacity-50"
          >
            <PlusIcon size={18} color="currentColor" />
            {createBoard.isPending ? "Creating…" : "Create board"}
          </button>
        </form>
        {formError && <p className="mb-4 text-sm text-red-600">{formError}</p>}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <>
            {error && (
              <p className="text-red-600">
                {error instanceof Error ? error.message : "Failed to load boards"}
              </p>
            )}

            {boards && boards.length === 0 && (
              <div className="rounded-xl border border-dashed border-teal-800/20 bg-teal-50/50 px-6 py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                  <BoardIcon size={24} color="currentColor" />
                </div>
                <p className="font-medium text-teal-950">No boards yet</p>
                <p className="mt-1 text-sm text-slate-600">
                  Create one above, or ask a teammate to invite you with your account email.
                </p>
              </div>
            )}

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {boards?.map((board) => (
                <li key={board.id} className="group relative">
                  <Link
                    href={`/boards/${board.id}`}
                    style={{
                      backgroundColor:
                        board.background_color ?? DEFAULT_BOARD_BACKGROUND_COLOR,
                    }}
                    className="block rounded-xl border border-black/10 p-5 pr-12 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <p className="text-lg font-semibold">{board.title}</p>
                    <p className="mt-3 flex items-center gap-1.5 text-xs uppercase tracking-wide text-white/75">
                      {board.role === "owner" ? (
                        <CrownIcon size={14} color="currentColor" />
                      ) : (
                        <UserIcon size={14} color="currentColor" />
                      )}
                      {board.role}
                    </p>
                  </Link>
                  {board.role === "owner" && (
                    <button
                      type="button"
                      aria-label={`Delete ${board.title}`}
                      onClick={() => {
                        setDeleteError(null);
                        setBoardToDelete(board);
                      }}
                      className="absolute right-3 top-3 cursor-pointer rounded-lg p-1.5 text-white/70 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100 focus:opacity-100"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      <ConfirmModal
        open={Boolean(boardToDelete)}
        title="Delete board?"
        error={deleteError}
        message={
          boardToDelete
            ? `“${boardToDelete.title}” and all its lists, cards, and comments will be permanently deleted. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete board"
        loading={deleteBoard.isPending}
        onConfirm={() => void onConfirmDelete()}
        onCancel={() => {
          if (!deleteBoard.isPending) {
            setBoardToDelete(null);
            setDeleteError(null);
          }
        }}
      />
    </div>
  );
}
