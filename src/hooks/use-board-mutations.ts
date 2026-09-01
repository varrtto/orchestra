"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/boards";
import { useBoardStore } from "@/stores/board-store";
import type { BoardRole, Card } from "@/lib/types";

type CardPatch = Partial<
  Pick<Card, "title" | "description" | "due_date" | "list_id" | "position">
>;

type ListLayoutUpdate = { listId: string; cardIds: string[] };

export function useAddListMutation() {
  const addList = useBoardStore((s) => s.addList);
  return useMutation({
    mutationFn: (title: string) => addList(title),
  });
}

export function useRenameListMutation() {
  const renameList = useBoardStore((s) => s.renameList);
  return useMutation({
    mutationFn: ({ listId, title }: { listId: string; title: string }) =>
      renameList(listId, title),
  });
}

export function useDeleteListMutation() {
  const deleteList = useBoardStore((s) => s.deleteList);
  return useMutation({
    mutationFn: (listId: string) => deleteList(listId),
  });
}

export function useReorderListsMutation() {
  const reorderLists = useBoardStore((s) => s.reorderLists);
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderLists(orderedIds),
  });
}

export function useAddCardMutation() {
  const addCard = useBoardStore((s) => s.addCard);
  return useMutation({
    mutationFn: ({ listId, title }: { listId: string; title: string }) =>
      addCard(listId, title),
  });
}

export function useUpdateCardMutation() {
  const updateCard = useBoardStore((s) => s.updateCard);
  return useMutation({
    mutationFn: ({ cardId, patch }: { cardId: string; patch: CardPatch }) =>
      updateCard(cardId, patch),
  });
}

export function useDeleteCardMutation() {
  const deleteCard = useBoardStore((s) => s.deleteCard);
  return useMutation({
    mutationFn: (cardId: string) => deleteCard(cardId),
  });
}

export function useCommitListsLayoutMutation() {
  const commitListsLayout = useBoardStore((s) => s.commitListsLayout);
  return useMutation({
    mutationFn: (updates: ListLayoutUpdate[]) => commitListsLayout(updates),
  });
}

export function useToggleLabelMutation() {
  const toggleLabel = useBoardStore((s) => s.toggleLabel);
  return useMutation({
    mutationFn: ({ cardId, labelId }: { cardId: string; labelId: string }) =>
      toggleLabel(cardId, labelId),
  });
}

export function useToggleAssigneeMutation() {
  const toggleAssignee = useBoardStore((s) => s.toggleAssignee);
  return useMutation({
    mutationFn: ({ cardId, userId }: { cardId: string; userId: string }) =>
      toggleAssignee(cardId, userId),
  });
}

export function useAddCommentMutation() {
  const addComment = useBoardStore((s) => s.addComment);
  return useMutation({
    mutationFn: ({ cardId, body }: { cardId: string; body: string }) =>
      addComment(cardId, body),
  });
}

export function useUpdateCommentMutation() {
  const updateComment = useBoardStore((s) => s.updateComment);
  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      updateComment(commentId, body),
  });
}

export function useDeleteCommentMutation() {
  const deleteComment = useBoardStore((s) => s.deleteComment);
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
  });
}

export function useInviteMemberMutation() {
  const inviteMember = useBoardStore((s) => s.inviteMember);
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: BoardRole }) =>
      inviteMember(email, role),
  });
}

export function useRemoveMemberMutation() {
  const removeMember = useBoardStore((s) => s.removeMember);
  return useMutation({
    mutationFn: (userId: string) => removeMember(userId),
  });
}

export function useUpdateMemberRoleMutation() {
  const updateMemberRole = useBoardStore((s) => s.updateMemberRole);
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: BoardRole }) =>
      updateMemberRole(userId, role),
  });
}

export function useTransferOwnershipMutation() {
  const queryClient = useQueryClient();
  const boardId = useBoardStore((s) => s.board?.id);
  const transferOwnership = useBoardStore((s) => s.transferOwnership);

  return useMutation({
    mutationFn: (newOwnerId: string) => transferOwnership(newOwnerId),
    onSuccess: () => {
      if (!boardId) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards });
    },
  });
}

export function useRenameBoardMutation() {
  const queryClient = useQueryClient();
  const boardId = useBoardStore((s) => s.board?.id);
  const renameBoard = useBoardStore((s) => s.renameBoard);

  return useMutation({
    mutationFn: (title: string) => renameBoard(title),
    onSuccess: () => {
      if (!boardId) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards });
    },
  });
}

export function useUpdateBoardBackgroundColorMutation() {
  const queryClient = useQueryClient();
  const boardId = useBoardStore((s) => s.board?.id);
  const updateBoardBackgroundColor = useBoardStore(
    (s) => s.updateBoardBackgroundColor,
  );

  return useMutation({
    mutationFn: (backgroundColor: string) =>
      updateBoardBackgroundColor(backgroundColor),
    onSuccess: () => {
      if (!boardId) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards });
    },
  });
}

export function useLeaveBoardMutation() {
  const queryClient = useQueryClient();
  const leaveBoard = useBoardStore((s) => s.leaveBoard);

  return useMutation({
    mutationFn: () => leaveBoard(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards });
    },
  });
}

export function useDeleteActiveBoardMutation() {
  const queryClient = useQueryClient();
  const boardId = useBoardStore((s) => s.board?.id);
  const deleteBoard = useBoardStore((s) => s.deleteBoard);

  return useMutation({
    mutationFn: () => deleteBoard(),
    onSuccess: () => {
      if (boardId) {
        queryClient.removeQueries({ queryKey: queryKeys.board(boardId) });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards });
    },
  });
}
