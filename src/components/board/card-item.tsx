"use client";

import { useBoardStore } from "@/stores/board-store";
import type { Card } from "@/lib/types";
import { CalendarIcon, CommentIcon } from "@/components/ui/icon";

export function CardItem({ card }: { card: Card }) {
  const setSelectedCardId = useBoardStore((s) => s.setSelectedCardId);
  const cardLabels = useBoardStore((s) => s.cardLabels);
  const labels = useBoardStore((s) => s.labels);
  const cardAssignees = useBoardStore((s) => s.cardAssignees);
  const comments = useBoardStore((s) => s.comments);

  const labelIds = cardLabels
    .filter((cl) => cl.card_id === card.id)
    .map((cl) => cl.label_id);
  const activeLabels = labels.filter((l) => labelIds.includes(l.id));
  const assignees = cardAssignees.filter((a) => a.card_id === card.id);
  const commentCount = comments.filter((c) => c.card_id === card.id).length;

  return (
    <li
      data-label={card.id}
      onClick={() => setSelectedCardId(card.id)}
      className="cursor-pointer rounded-lg border border-teal-900/5 bg-white px-3 py-2 shadow-sm transition hover:border-teal-700/30 hover:shadow"
    >
      {activeLabels.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {activeLabels.map((label) => (
            <span
              key={label.id}
              title={label.name}
              className="h-1.5 w-8 rounded-full"
              style={{ backgroundColor: label.color }}
            />
          ))}
        </div>
      )}
      <p className="text-sm font-medium text-slate-800">{card.title}</p>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
        {card.due_date && (
          <span className="inline-flex items-center gap-1">
            <CalendarIcon size={12} />
            {new Date(card.due_date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
        {commentCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <CommentIcon size={12} />
            {commentCount}
          </span>
        )}
        {assignees.length > 0 && (
          <span className="ml-auto flex -space-x-1">
            {assignees.slice(0, 3).map((a) => (
              <span
                key={a.user_id}
                title={a.profile?.display_name ?? a.profile?.email}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-[9px] font-semibold text-white"
              >
                {(a.profile?.display_name ?? a.profile?.email ?? "?")
                  .slice(0, 1)
                  .toUpperCase()}
              </span>
            ))}
          </span>
        )}
      </div>
    </li>
  );
}
