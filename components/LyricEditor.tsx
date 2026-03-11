"use client";

import { useRef, useCallback, useState } from "react";
import { isSectionTag } from "@/lib/utils";
import { Copy, CheckCheck } from "lucide-react";

const LINE_STYLE = {
  fontSize: "1rem",
  lineHeight: "2",
} as const;

interface LyricEditorProps {
  content: string;
  onChange: (val: string) => void;
  onAiRequest: (text: string) => void;
}

export default function LyricEditor({
  content,
  onChange,
  onAiRequest,
}: LyricEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

  const handleAiSelection = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const selected = content.slice(ta.selectionStart, ta.selectionEnd).trim();
    if (selected) onAiRequest(selected);
  }, [content, onAiRequest]);

  // 全文コピー（SUNO提出用）
  const handleCopyAll = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー：ラベル + コピーボタンのみ（セクションタグなし） */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-ink-800 flex-shrink-0">
        <span
          className="text-xs text-amber-600"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          final
        </span>
        <button
          onClick={handleCopyAll}
          className="flex items-center gap-1 px-2 py-0.5 rounded border border-ink-700 text-xs text-ink-400 hover:border-amber-500 hover:text-amber-400 transition-colors"
          title="全文をコピー（SUNO提出用）"
        >
          {copied ? <CheckCheck size={11} /> : <Copy size={11} />}
          <span style={{ fontFamily: "var(--font-mono)" }}>{copied ? "copied" : "copy"}</span>
        </button>
      </div>

      {/* テキストエリア（カウント列なし・セクションタグボタンなし） */}
      <div className="flex-1 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onMouseUp={handleAiSelection}
          onKeyUp={(e) => { if (e.shiftKey && e.key === "F2") handleAiSelection(); }}
          className="lyric-editor px-3 overflow-y-auto"
          style={{ height: "100%", paddingTop: "1rem", paddingBottom: "1rem" }}
          placeholder="本番歌詞…"
          spellCheck={false}
        />
      </div>

      {/* フッター：行数のみ */}
      <div className="flex items-center justify-end px-3 py-2 border-t border-ink-800 flex-shrink-0">
        <span className="text-xs text-ink-600" style={{ fontFamily: "var(--font-mono)" }}>
          {content.split("\n").filter((l) => l.trim() && !isSectionTag(l)).length} lines
        </span>
      </div>
    </div>
  );
}
