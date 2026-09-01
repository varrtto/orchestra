"use client";

import { useMutation } from "@tanstack/react-query";
import {
  forgotPassword,
  login,
  resetPassword,
  signOut,
  signUp,
  type ForgotPasswordInput,
  type LoginInput,
  type ResetPasswordInput,
  type SignupInput,
} from "@/lib/queries/auth";

export function useLoginMutation() {
  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
  });
}

export function useSignupMutation() {
  return useMutation({
    mutationFn: (input: SignupInput) => signUp(input),
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) => forgotPassword(input),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => resetPassword(input),
  });
}

export function useSignOutMutation() {
  return useMutation({
    mutationFn: signOut,
  });
}
