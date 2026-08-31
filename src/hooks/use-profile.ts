"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchProfile,
  profileQueryKey,
  updateProfile,
} from "@/lib/queries/profile";

export function useProfileQuery() {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: fetchProfile,
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey, profile);
    },
  });
}
