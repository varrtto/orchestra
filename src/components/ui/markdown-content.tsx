"use client";

import { markdownSanitizeSchema } from "@/lib/markdown/sanitize-schema";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

const markdownComponents: Components = {
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-teal-700 underline decoration-teal-700/40 underline-offset-2 hover:decoration-teal-700"
    >
      {children}
    </a>
  ),
  input: ({ checked, disabled, type }) => {
    if (type !== "checkbox") return null;
    return (
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled ?? true}
        readOnly
        className="mr-1.5 align-middle"
      />
    );
  },
};

type MarkdownContentProps = {
  children: string;
  className?: string;
  emptyFallback?: string;
};

export function MarkdownContent({
  children,
  className = "",
  emptyFallback,
}: MarkdownContentProps) {
  const trimmed = children.trim();
  if (!trimmed) {
    if (emptyFallback) {
      return <p className="text-sm text-slate-400">{emptyFallback}</p>;
    }
    return null;
  }

  return (
    <div className={`markdown-content text-sm text-slate-800 ${className}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, markdownSanitizeSchema]]}
        components={markdownComponents}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
