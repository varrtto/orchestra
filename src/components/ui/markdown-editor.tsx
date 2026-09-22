"use client";

import { CodeBlockIcon, CodeInlineIcon, LinkIcon } from "@/components/ui/icon";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { useT } from "@/components/providers/locale-provider";
import { insertAtCursor } from "@/lib/markdown/insert-at-cursor";
import type { ReactNode } from "react";
import { useId, useRef, useState } from "react";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  minHeightClassName?: string;
  showToolbar?: boolean;
};

type EditorTab = "write" | "preview";

function ToolbarButton({
  title,
  disabled,
  onClick,
  children,
  className = "",
}: {
  title: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded p-1 text-xs text-slate-600 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700 ${className}`.trim()}
    >
      {children}
    </button>
  );
}

export function MarkdownEditor({
  value,
  onChange,
  onBlur,
  disabled = false,
  placeholder,
  minHeightClassName = "min-h-28",
  showToolbar = true,
}: MarkdownEditorProps) {
  const t = useT();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<EditorTab>("write");
  const writeTabId = useId();
  const previewTabId = useId();

  function wrapSelection(before: string, after: string, placeholderText = "") {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;
    onChange(insertAtCursor(textarea, before, after, placeholderText));
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/70 px-2 py-1.5">
        {showToolbar ? (
          <div className="flex flex-wrap items-center gap-0.5">
            <ToolbarButton
              title={t("editor.bold")}
              disabled={disabled || tab === "preview"}
              className="font-bold"
              onClick={() => wrapSelection("**", "**", "bold")}
            >
              B
            </ToolbarButton>
            <ToolbarButton
              title={t("editor.italic")}
              disabled={disabled || tab === "preview"}
              className="italic"
              onClick={() => wrapSelection("*", "*", "italic")}
            >
              I
            </ToolbarButton>
            <ToolbarButton
              title={t("editor.link")}
              disabled={disabled || tab === "preview"}
              onClick={() => wrapSelection("[", "](https://)", "text")}
            >
              <LinkIcon size={14} />
            </ToolbarButton>
            <ToolbarButton
              title={t("editor.inlineCode")}
              disabled={disabled || tab === "preview"}
              onClick={() => wrapSelection("`", "`", "code")}
            >
              <CodeInlineIcon size={14} />
            </ToolbarButton>
            <ToolbarButton
              title={t("editor.codeBlock")}
              disabled={disabled || tab === "preview"}
              onClick={() => wrapSelection("```\n", "\n```", "code")}
            >
              <CodeBlockIcon size={14} />
            </ToolbarButton>
          </div>
        ) : (
          <span />
        )}
        <div
          className="inline-flex rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 p-0.5 text-xs"
          role="tablist"
          aria-label={t("editor.mode")}
        >
          <button
            type="button"
            id={writeTabId}
            role="tab"
            aria-selected={tab === "write"}
            aria-controls={`${writeTabId}-panel`}
            disabled={disabled}
            onClick={() => setTab("write")}
            className={`rounded px-2 py-0.5 ${
              tab === "write"
                ? "bg-teal-700 text-white"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {t("editor.write")}
          </button>
          <button
            type="button"
            id={previewTabId}
            role="tab"
            aria-selected={tab === "preview"}
            aria-controls={`${previewTabId}-panel`}
            onClick={() => setTab("preview")}
            className={`rounded px-2 py-0.5 ${
              tab === "preview"
                ? "bg-teal-700 text-white"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {t("editor.preview")}
          </button>
        </div>
      </div>

      {tab === "write" ? (
        <textarea
          ref={textareaRef}
          id={`${writeTabId}-panel`}
          role="tabpanel"
          aria-labelledby={writeTabId}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className={`${minHeightClassName} w-full resize-y border-0 bg-white px-3 py-2 text-sm outline-none ring-teal-600 focus:ring-2 dark:bg-slate-900 dark:text-slate-100`}
        />
      ) : (
        <div
          id={`${previewTabId}-panel`}
          role="tabpanel"
          aria-labelledby={previewTabId}
          className={`${minHeightClassName} overflow-y-auto bg-white px-3 py-2 dark:bg-slate-900`}
        >
          <MarkdownContent emptyFallback={t("editor.nothingToPreview")}>
            {value}
          </MarkdownContent>
        </div>
      )}
    </div>
  );
}
