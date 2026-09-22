"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { SectionLabel } from "@/components/ui/section-label";
import {
  CrownIcon,
  EnvelopeIcon,
  GearIcon,
  LayersIcon,
  PencilIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/ui/icon";
import {
  BOARD_BACKGROUND_PRESETS,
  DEFAULT_BOARD_BACKGROUND_COLOR,
} from "@/lib/board-background";
import {
  useDeleteActiveBoardMutation,
  useInviteMemberMutation,
  useLeaveBoardMutation,
  useRemoveMemberMutation,
  useRevokeInviteMutation,
  useRenameBoardMutation,
  useTransferOwnershipMutation,
  useUpdateBoardBackgroundColorMutation,
  useUpdateMemberRoleMutation,
} from "@/hooks/use-board-mutations";
import { useBoardStore } from "@/stores/board-store";
import type { BoardRole } from "@/lib/types";
import { useT } from "@/components/providers/locale-provider";

type BoardSettingsSidebarProps = {
  open: boolean;
};

function roleLabel(role: BoardRole, t: ReturnType<typeof useT>) {
  if (role === "owner") return t("roles.owner");
  if (role === "editor") return t("roles.editor");
  return t("roles.viewer");
}

export function BoardSettingsSidebar({ open }: BoardSettingsSidebarProps) {
  const t = useT();
  const router = useRouter();
  const board = useBoardStore((s) => s.board);
  const members = useBoardStore((s) => s.members);
  const invites = useBoardStore((s) => s.invites);
  const role = useBoardStore((s) => s.role);
  const canEdit = useBoardStore((s) => s.canEdit);
  const currentUserId = useBoardStore((s) => s.currentUserId);
  const renameBoard = useRenameBoardMutation();
  const updateBoardBackgroundColor = useUpdateBoardBackgroundColorMutation();
  const inviteMember = useInviteMemberMutation();
  const revokeInvite = useRevokeInviteMutation();
  const removeMember = useRemoveMemberMutation();
  const updateMemberRole = useUpdateMemberRoleMutation();
  const transferOwnership = useTransferOwnershipMutation();
  const leaveBoard = useLeaveBoardMutation();
  const deleteBoard = useDeleteActiveBoardMutation();

  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [backgroundError, setBackgroundError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<BoardRole>("editor");
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [confirmAction, setConfirmAction] = useState<
    "leave" | "delete" | "transfer" | null
  >(null);
  const [transferTargetId, setTransferTargetId] = useState("");
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferMessage, setTransferMessage] = useState<string | null>(null);
  const [dangerError, setDangerError] = useState<string | null>(null);

  const editable = canEdit();
  const isOwner = role === "owner";
  const boardTitle = titleDraft ?? board?.title ?? "";
  const boardBackground =
    board?.background_color ?? DEFAULT_BOARD_BACKGROUND_COLOR;

  const transferCandidates = useMemo(
    () => members.filter((m) => m.user_id !== currentUserId),
    [members, currentUserId],
  );

  const transferTarget = members.find((m) => m.user_id === transferTargetId);

  async function saveTitleOnBlur() {
    const trimmed = boardTitle.trim();
    if (!trimmed || trimmed === board?.title) {
      setTitleDraft(null);
      return;
    }
    setTitleError(null);
    try {
      await renameBoard.mutateAsync(trimmed);
      setTitleDraft(null);
    } catch (err) {
      setTitleError(err instanceof Error ? err.message : t("settings.saveNameFailed"));
    }
  }

  async function onBackgroundChange(color: string) {
    if (!editable || color === boardBackground) return;
    setBackgroundError(null);
    try {
      await updateBoardBackgroundColor.mutateAsync(color);
    } catch (err) {
      setBackgroundError(
        err instanceof Error ? err.message : t("settings.saveBackgroundFailed"),
      );
    }
  }

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteMessage(null);
    setInviteError(null);
    const trimmedEmail = email.trim();
    try {
      await inviteMember.mutateAsync({ email: trimmedEmail, role: inviteRole });
      setInviteMessage(
        t("settings.inviteSaved", { email: trimmedEmail }),
      );
      setEmail("");
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : t("settings.inviteFailed"));
    }
  }

  async function onRevokeInvite(inviteId: string) {
    setInviteError(null);
    try {
      await revokeInvite.mutateAsync(inviteId);
    } catch (err) {
      setInviteError(
        err instanceof Error ? err.message : t("settings.cancelInviteFailed"),
      );
    }
  }

  async function onConfirmDanger() {
    setDangerError(null);
    try {
      if (confirmAction === "leave") {
        await leaveBoard.mutateAsync();
        router.push("/boards");
      } else if (confirmAction === "delete") {
        await deleteBoard.mutateAsync();
        router.push("/boards");
      }
      setConfirmAction(null);
    } catch (err) {
      setDangerError(
        err instanceof Error ? err.message : t("settings.somethingWentWrong"),
      );
    }
  }

  async function onConfirmTransfer() {
    if (!transferTargetId) return;
    setTransferError(null);
    try {
      await transferOwnership.mutateAsync(transferTargetId);
      setTransferMessage(t("settings.transferSuccess"));
      setTransferTargetId("");
      setConfirmAction(null);
    } catch (err) {
      setTransferError(
        err instanceof Error ? err.message : t("settings.transferFailed"),
      );
    }
  }

  return (
    <>
      <aside
        className={`flex h-full shrink-0 flex-col overflow-hidden border-l border-teal-950/20 dark:border-white/10 bg-white dark:bg-slate-900 transition-[width] duration-300 ease-in-out ${
          open ? "w-80" : "w-0 border-l-0"
        }`}
      >
        <div
          className={`flex h-full w-80 flex-col transition-opacity duration-200 ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div className="flex items-center border-b border-slate-100 dark:border-slate-700 px-4 py-3 pr-12">
            <h2 className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
              <GearIcon size={18} color="#0f766e" />
              {t("settings.title")}
            </h2>
          </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <section>
            <SectionLabel icon={<PencilIcon size={14} />}>
              {t("settings.general")}
            </SectionLabel>
            <div className="space-y-2">
              <label htmlFor="board-title" className="sr-only">
                {t("settings.boardName")}
              </label>
              <input
                id="board-title"
                value={boardTitle}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={() => void saveTitleOnBlur()}
                disabled={!editable || renameBoard.isPending}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm outline-none ring-teal-600 focus:ring-2 disabled:bg-slate-50 dark:disabled:bg-slate-800"
              />
              {titleError && (
                <p className="text-xs text-red-600 dark:text-red-400">{titleError}</p>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <SectionLabel icon={<LayersIcon size={14} />}>
                {t("settings.background")}
              </SectionLabel>
              <div className="grid grid-cols-4 gap-2">
                {BOARD_BACKGROUND_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    title={preset.name}
                    disabled={!editable || updateBoardBackgroundColor.isPending}
                    onClick={() => void onBackgroundChange(preset.value)}
                    className={`aspect-square rounded-lg border-2 transition hover:scale-105 disabled:opacity-50 ${
                      boardBackground === preset.value
                        ? "border-teal-600 ring-2 ring-teal-600/30"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: preset.value }}
                  />
                ))}
              </div>
              {editable && (
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input
                    type="color"
                    value={boardBackground}
                    disabled={updateBoardBackgroundColor.isPending}
                    onChange={(e) => void onBackgroundChange(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 p-0.5"
                  />
                  {t("settings.customColor")}
                </label>
              )}
              {backgroundError && (
                <p className="text-xs text-red-600 dark:text-red-400">{backgroundError}</p>
              )}
            </div>
          </section>

          {isOwner && (
            <section>
              <SectionLabel icon={<CrownIcon size={14} />}>
                {t("settings.transferOwnership")}
              </SectionLabel>
              <div className="space-y-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 px-3 py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("settings.transferHint")}
                </p>
                <select
                  value={transferTargetId}
                  onChange={(e) => {
                    setTransferTargetId(e.target.value);
                    setTransferMessage(null);
                    setTransferError(null);
                  }}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm"
                >
                  <option value="">{t("settings.selectMember")}</option>
                  {transferCandidates.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.profile?.display_name ?? member.profile?.email} (
                      {roleLabel(member.role, t)})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!transferTargetId}
                  onClick={() => {
                    setTransferError(null);
                    setConfirmAction("transfer");
                  }}
                  className="w-full rounded-lg border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950 disabled:opacity-50"
                >
                  {t("settings.transferButton")}
                </button>
                {transferMessage && (
                  <p className="text-xs text-teal-700 dark:text-teal-300">{transferMessage}</p>
                )}
                {transferError && !confirmAction && (
                  <p className="text-xs text-red-600 dark:text-red-400">{transferError}</p>
                )}
              </div>
            </section>
          )}

          <section>
            <SectionLabel icon={<UsersIcon size={14} />}>
              {t("settings.members", { count: members.length })}
            </SectionLabel>
            <ul className="space-y-2">
              {members.map((member) => (
                <li
                  key={member.user_id}
                  className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                        {member.profile?.display_name ?? member.profile?.email}
                        {member.user_id === currentUserId && (
                          <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">
                            {t("common.you")}
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {member.profile?.email}
                      </p>
                    </div>
                    {isOwner &&
                      member.user_id !== currentUserId &&
                      member.role !== "owner" && (
                        <button
                          type="button"
                          className="shrink-0 text-xs text-red-600 dark:text-red-400"
                          onClick={() => removeMember.mutate(member.user_id)}
                        >
                          {t("settings.remove")}
                        </button>
                      )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {isOwner &&
                    member.user_id !== currentUserId &&
                    member.role !== "owner" ? (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          updateMemberRole.mutate({
                            userId: member.user_id,
                            role: e.target.value as BoardRole,
                          })
                        }
                        className="rounded border border-slate-200 dark:border-slate-600 px-2 py-1 text-xs"
                      >
                        <option value="editor">{t("roles.editor")}</option>
                        <option value="viewer">{t("roles.viewer")}</option>
                      </select>
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {roleLabel(member.role, t)}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {editable && (
            <section>
              <SectionLabel icon={<EnvelopeIcon size={14} />}>
                {t("settings.invite")}
              </SectionLabel>
              <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                {t("settings.inviteHint")}
              </p>
              <form onSubmit={onInvite} className="space-y-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teammate@company.com"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm outline-none ring-teal-600 focus:ring-2"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as BoardRole)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm"
                >
                  <option value="editor">{t("roles.editor")}</option>
                  <option value="viewer">{t("roles.viewer")}</option>
                </select>
                <button
                  type="submit"
                  disabled={inviteMember.isPending}
                  className="w-full rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
                >
                  {inviteMember.isPending
                    ? t("common.saving")
                    : t("settings.saveInvite")}
                </button>
                {inviteMessage && (
                  <p className="text-xs text-teal-700 dark:text-teal-300">{inviteMessage}</p>
                )}
                {inviteError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{inviteError}</p>
                )}
              </form>
              {invites.length > 0 && (
                <ul className="mt-4 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("settings.pendingInvites")}
                  </p>
                  {invites.map((invite) => (
                    <li
                      key={invite.id}
                      className="flex items-start justify-between gap-2 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                          {invite.email}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {roleLabel(invite.role, t)} ·{" "}
                          {t("settings.waitingForSignIn")}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 text-xs text-red-600 dark:text-red-400"
                        disabled={revokeInvite.isPending}
                        onClick={() => void onRevokeInvite(invite.id)}
                      >
                        {t("settings.cancel")}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section>
            <SectionLabel icon={<ShieldIcon size={14} />}>
              {t("settings.dangerZone")}
            </SectionLabel>
            <div className="space-y-2">
              {!isOwner && (
                <button
                  type="button"
                  onClick={() => setConfirmAction("leave")}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                >
                  {t("settings.leaveBoard")}
                </button>
              )}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setConfirmAction("delete")}
                  className="w-full rounded-lg border border-red-200 dark:border-red-900 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
                >
                  {t("settings.deleteBoard")}
                </button>
              )}
            </div>
          </section>
        </div>
        </div>
      </aside>

      <ConfirmModal
        open={confirmAction === "transfer"}
        title={t("settings.transferConfirmTitle")}
        error={transferError}
        message={
          transferTarget
            ? t("settings.transferConfirmMessage", {
                name:
                  transferTarget.profile?.display_name ??
                  transferTarget.profile?.email ??
                  "",
              })
            : ""
        }
        confirmLabel={t("settings.transferButton")}
        loading={transferOwnership.isPending}
        onConfirm={() => void onConfirmTransfer()}
        onCancel={() => {
          if (!transferOwnership.isPending) {
            setConfirmAction(null);
            setTransferError(null);
          }
        }}
      />
      <ConfirmModal
        open={confirmAction === "leave"}
        title={t("settings.leaveConfirmTitle")}
        message={t("settings.leaveConfirmMessage")}
        confirmLabel={t("settings.leaveBoard")}
        error={dangerError}
        loading={leaveBoard.isPending || deleteBoard.isPending}
        onConfirm={() => void onConfirmDanger()}
        onCancel={() => {
          if (!leaveBoard.isPending && !deleteBoard.isPending) {
            setConfirmAction(null);
            setDangerError(null);
          }
        }}
      />
      <ConfirmModal
        open={confirmAction === "delete"}
        title={t("settings.deleteConfirmTitle")}
        message={t("settings.deleteConfirmMessage", {
          title: board?.title ?? "",
        })}
        confirmLabel={t("settings.deleteBoard")}
        error={dangerError}
        loading={leaveBoard.isPending || deleteBoard.isPending}
        onConfirm={() => void onConfirmDanger()}
        onCancel={() => {
          if (!leaveBoard.isPending && !deleteBoard.isPending) {
            setConfirmAction(null);
            setDangerError(null);
          }
        }}
      />
    </>
  );
}
