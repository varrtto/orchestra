"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBoard,
  deleteBoard,
  fetchBoard,
  fetchBoards,
  queryKeys,
} from "@/lib/queries/boards";

export function useBoardsQuery() {
  return useQuery({
    queryKey: queryKeys.boards,
    queryFn: fetchBoards,
  });
}

export function useBoardQuery(boardId: string) {
  return useQuery({
    queryKey: queryKeys.board(boardId),
    queryFn: () => fetchBoard(boardId),
    enabled: Boolean(boardId),
  });
}

export function useCreateBoardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => createBoard(title),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards });
    },
  });
}

export function useDeleteBoardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (boardId: string) => deleteBoard(boardId),
    onSuccess: (_data, boardId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards });
      queryClient.removeQueries({ queryKey: queryKeys.board(boardId) });
    },
  });
}
