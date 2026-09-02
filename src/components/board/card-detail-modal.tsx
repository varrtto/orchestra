"use client";

import { useId, useMemo, useState } from "react";
import { useBoardStore } from "@/stores/board-store";
import {
  useAddCommentMutation,
  useDeleteCardMutation,
  useDeleteCommentMutation,
  useToggleAssigneeMutation,
  useToggleLabelMutation,
  useUpdateCardMutation,
  useUpdateCommentMutation,
} from "@/hooks/use-board-mutations";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Modal } from "@/components/ui/modal";
import { formatCardKey } from "@/lib/card-key";
import type { Comment } from "@/lib/types";
import {
  CalendarIcon,
  CommentIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  XIcon,
} from "@/components/ui/icon";

export function CardDetailModal() {
  const selectedCardId = useBoardStore((s) => s.selectedCardId);
  const setSelectedCardId = useBoardStore((s) => s.setSelectedCardId);
  const board = useBoardStore((s) => s.board);
  const cards = useBoardStore((s) => s.cards);
  const labels = useBoardStore((s) => s.labels);
  const cardLabels = useBoardStore((s) => s.cardLabels);
  const members = useBoardStore((s) => s.members);
  const cardAssignees = useBoardStore((s) => s.cardAssignees);
  const comments = useBoardStore((s) => s.comments);
  const canEdit = useBoardStore((s) => s.canEdit);
  const currentUserId = useBoardStore((s) => s.currentUserId);
  const role = useBoardStore((s) => s.role);
  const updateCard = useUpdateCardMutation();
  const deleteCard = useDeleteCardMutation();
  const toggleLabel = useToggleLabelMutation();
  const toggleAssignee = useToggleAssigneeMutation();
  const addComment = useAddCommentMutation();
  const updateComment = useUpdateCommentMutation();
  const deleteComment = useDeleteCommentMutation();

  const card = cards.find((c) => c.id === selectedCardId);
  const editable = canEdit();
  const canManageAssignees = role === "owner" || role === "editor";
  const titleId = useId();

  const [commentDraft, setCommentDraft] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [deleteCommentError, setDeleteCommentError] = useState<string | null>(
    null,
  );

  async function onConfirmDeleteComment() {
    if (!commentToDelete) return;
    setDeleteCommentError(null);
    try {
      await deleteComment.mutateAsync(commentToDelete.id);
      if (editingCommentId === commentToDelete.id) {
        setEditingCommentId(null);
        setEditingBody("");
      }
      setCommentToDelete(null);
    } catch (err) {
      setDeleteCommentError(
        err instanceof Error ? err.message : "Failed to delete comment",
      );
    }
  }

  async function onConfirmDelete() {
    if (!selectedCardId) return;
    setDeleteError(null);
    try {
      await deleteCard.mutateAsync(selectedCardId);
      setConfirmDelete(false);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete card",
      );
    }
  }

  const cardCommentList = useMemo(
    () =>
      comments
        .filter((c) => c.card_id === selectedCardId)
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ),
    [comments, selectedCardId],
  );

  if (!card) return null;

  const activeLabelIds = new Set(
    cardLabels.filter((cl) => cl.card_id === card.id).map((cl) => cl.label_id),
  );
  const activeAssigneeIds = new Set(
    cardAssignees
      .filter((ca) => ca.card_id === card.id)
      .map((ca) => ca.user_id),
  );
  const assignedMembers = members.filter((member) =>
    activeAssigneeIds.has(member.user_id),
  );
  const cardRef =
    board?.key && card.number ? formatCardKey(board.key, card.number) : null;

  return (
    <>
      <Modal
        open
        onClose={() => setSelectedCardId(null)}
        ariaLabelledBy={titleId}
        overlayClassName="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-teal-950/50 p-4 pt-16 backdrop-blur-sm"
        panelClassName="w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
            {cardRef && (
              <span className="shrink-0 font-mono text-sm font-medium uppercase tracking-wide text-slate-400">
                {cardRef}
              </span>
            )}
            {cardRef && (
              <span className="shrink-0 text-slate-300" aria-hidden>
                /
              </span>
            )}
            <input
              id={titleId}
              className="min-w-0 flex-1 text-xl font-semibold text-slate-900 outline-none"
              defaultValue={card.title}
              disabled={!editable}
              onBlur={(e) => {
                const next = e.target.value.trim();
                if (next && next !== card.title) {
                  updateCard.mutate({ cardId: card.id, patch: { title: next } });
                } else {
                  e.target.value = card.title;
                }
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => setSelectedCardId(null)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close card"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="grid gap-6 px-5 py-5 sm:grid-cols-[1fr_180px]">
          <div className="space-y-5">
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Description
              </h3>
              <textarea
                className="min-h-28 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 focus:ring-2"
                defaultValue={card.description}
                disabled={!editable}
                placeholder="Add a more detailed description…"
                onBlur={(e) => {
                  if (e.target.value !== card.description) {
                    updateCard.mutate({
                      cardId: card.id,
                      patch: { description: e.target.value },
                    });
                  }
                }}
              />
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <CommentIcon size={14} color="#0f766e" />
                Comments
              </h3>
              <ul className="mb-3 space-y-3">
                {cardCommentList.length === 0 && (
                  <li className="text-sm text-slate-400">No comments yet</li>
                )}
                {cardCommentList.map((comment) => {
                  const canModify =
                    comment.author_id === currentUserId ||
                    role === "owner" ||
                    role === "editor";
                  const isEditing = editingCommentId === comment.id;
                  return (
                    <li
                      key={comment.id}
                      className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-slate-700">
                          {comment.author?.display_name ??
                            comment.author?.email ??
                            "Member"}
                          <span className="ml-2 font-normal text-slate-400">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </p>
                        {canModify && !isEditing && (
                          <div className="flex gap-1">
                            {comment.author_id === currentUserId && (
                              <button
                                type="button"
                                className="cursor-pointer rounded p-1 text-slate-400 hover:bg-teal-50 hover:text-teal-700"
                                aria-label="Edit comment"
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditingBody(comment.body);
                                }}
                              >
                                <PencilIcon size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              className="cursor-pointer rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              aria-label="Delete comment"
                              onClick={() => {
                                setDeleteCommentError(null);
                                setCommentToDelete(comment);
                              }}
                            >
                              <TrashIcon size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                            value={editingBody}
                            onChange={(e) => setEditingBody(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="rounded bg-teal-700 px-2 py-1 text-xs text-white"
                              onClick={async () => {
                                await updateComment.mutateAsync({
                                  commentId: comment.id,
                                  body: editingBody.trim(),
                                });
                                setEditingCommentId(null);
                              }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="text-xs text-slate-500"
                              onClick={() => setEditingCommentId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm text-slate-800">
                          {comment.body}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
              {editable && (
                <form
                  className="flex flex-col gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!commentDraft.trim()) return;
                    setCommentError(null);
                    try {
                      await addComment.mutateAsync({
                        cardId: card.id,
                        body: commentDraft.trim(),
                      });
                      setCommentDraft("");
                    } catch (err) {
                      setCommentError(
                        err instanceof Error ? err.message : "Failed to post comment",
                      );
                    }
                  }}
                >
                  <textarea
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    placeholder="Write a comment…"
                    className="min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 focus:ring-2"
                  />
                  {commentError && (
                    <p className="text-sm text-red-600">{commentError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={!commentDraft.trim() || addComment.isPending}
                    className="self-start rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {addComment.isPending ? "Posting…" : "Post comment"}
                  </button>
                </form>
              )}
            </section>
          </div>

          <aside className="space-y-4 text-sm">
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <CalendarIcon size={14} color="#0f766e" />
                Due date
              </h3>
              <input
                type="date"
                disabled={!editable}
                value={card.due_date ? card.due_date.slice(0, 10) : ""}
                onChange={(e) => {
                  updateCard.mutate({
                    cardId: card.id,
                    patch: {
                      due_date: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    },
                  });
                }}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 outline-none"
              />
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Labels
              </h3>
              <div className="flex flex-col gap-1">
                {labels.map((label) => {
                  const active = activeLabelIds.has(label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      disabled={!editable}
                      onClick={() => toggleLabel.mutate({ cardId: card.id, labelId: label.id })}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left ${
                        active ? "bg-teal-50 ring-1 ring-teal-600/30" : "hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      {label.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <UserIcon size={14} color="#0f766e" />
                Assignees
              </h3>
              {canManageAssignees ? (
                members.length === 0 ? (
                  <p className="text-sm text-slate-400">No board members yet</p>
                ) : (
                  <div className="space-y-1">
                    <select
                      value=""
                      onChange={(event) => {
                        const userId = event.target.value;
                        if (!userId) return;
                        toggleAssignee.mutate({ cardId: card.id, userId });
                      }}
                      className="w-full cursor-pointer rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none ring-teal-600 focus:ring-2"
                      aria-label="Card assignees"
                    >
                      <option value="" disabled>
                        {assignedMembers.length > 0
                          ? "Change assignees…"
                          : "Select a member…"}
                      </option>
                      {members.map((member) => (
                        <option key={member.user_id} value={member.user_id}>
                          {activeAssigneeIds.has(member.user_id) ? "✓ " : ""}
                          {member.profile?.display_name ?? member.profile?.email}
                        </option>
                      ))}
                    </select>
                    {assignedMembers.length > 0 && (
                      <p className="text-xs text-slate-500">
                        Assigned:{" "}
                        {assignedMembers
                          .map(
                            (member) =>
                              member.profile?.display_name ??
                              member.profile?.email,
                          )
                          .join(", ")}
                      </p>
                    )}
                  </div>
                )
              ) : assignedMembers.length > 0 ? (
                <ul className="space-y-1">
                  {assignedMembers.map((member) => (
                    <li
                      key={member.user_id}
                      className="rounded-lg bg-slate-50 px-2 py-1.5 text-slate-700"
                    >
                      {member.profile?.display_name ?? member.profile?.email}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">No assignees</p>
              )}
            </div>

            {editable && (
              <button
                type="button"
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-200 px-2 py-1.5 text-red-600 hover:bg-red-50"
                onClick={() => {
                  setDeleteError(null);
                  setConfirmDelete(true);
                }}
              >
                <TrashIcon size={16} />
                Delete card
              </button>
            )}
          </aside>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmDelete}
        title="Delete card?"
        message={`“${card.title}” will be permanently deleted.`}
        confirmLabel="Delete card"
        error={deleteError}
        loading={deleteCard.isPending}
        onConfirm={() => void onConfirmDelete()}
        onCancel={() => {
          if (!deleteCard.isPending) {
            setConfirmDelete(false);
            setDeleteError(null);
          }
        }}
      />
      <ConfirmModal
        open={Boolean(commentToDelete)}
        title="Delete comment?"
        message="This comment will be permanently deleted."
        confirmLabel="Delete comment"
        error={deleteCommentError}
        loading={deleteComment.isPending}
        onConfirm={() => void onConfirmDeleteComment()}
        onCancel={() => {
          if (!deleteComment.isPending) {
            setCommentToDelete(null);
            setDeleteCommentError(null);
          }
        }}
      />
    </>
  );
}
