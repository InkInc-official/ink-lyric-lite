"use client";

import { useRef, useCallback } from "react";
import { countMora, countChars, isSectionTag } from "@/lib/utils";
import { SectionTag } from "@/lib/types";

const SECTION_TAGS: SectionTag[] = [
  "[Main Theme]",
  "[Intro]",
  "[Verse]",
  "[Pre-Chorus]",
  "[Chorus]",
  "[Solo]",
  "[Bridge]",
  "[Outro]",
];

const LINE_STYLE = {
  fontSize: "1rem",
  lineHeight: "2",
} as const;

// 漢字を含む行はモーラカウントしない
const hasKanji = (str: string) => /[\u4e00-\u9faf\u3400-\u4dbf]/.test(str);

interface DraftEditorProps {
  content: string;
  onChange: (val: string) => void;
  noteTitle: string;
  onAiRequest: (text: string) => void;
}

export default function DraftEditor({
  content,
  onChange,
  noteTitle,
  onAiRequest,
}: DraftEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const countColRef = useRef<HTMLDivElement>(null);

  const insertTag = useCallback(
    (tag: SectionTag) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const before = content.slice(0, start);
      const after = content.slice(start);
      const newline = before.length > 0 && !before.endsWith("\n") ? "\n" : "";
      const newContent = `${before}${newline}${tag}\n${after}`;
      onChange(newContent);
      setTimeout(() => {
        const pos = start + newline.length + tag.length + 1;
        ta.setSelectionRange(pos, pos);
        ta.focus();
      }, 0);
    },
    [content, onChange]
  );

  const handleScroll = useCallback(() => {
    if (textareaRef.current && countColRef.current) {
      countColRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  const handleAiSelection = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const selected = content.slice(ta.selectionStart, ta.selectionEnd).trim();
    if (selected) onAiRequest(selected);
  }, [content, onAiRequest]);

  const lines = content.split("\n");

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー：セクションタグ + ゾーンラベル */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-ink-800 overflow-x-auto flex-shrink-0">
        <span className="text-xs text-ink-600 mr-1 flex-shrink-0" style={{ fontFamily: "var(--font-mono)" }}>
          draft
        </span>
        {SECTION_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => insertTag(tag)}
            className="section-tag px-2 py-0.5 rounded border border-ink-700 hover:border-amber-500 hover:text-amber-400 whitespace-nowrap transition-colors text-ink-400"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* エディタ本体 */}
      <div className="flex-1 flex overflow-hidden">
        {/* モーラカウント列 */}
        <div
          ref={countColRef}
          className="flex-shrink-0 w-14 overflow-y-hidden pl-1 select-none"
          style={{ ...LINE_STYLE, paddingTop: "1rem", paddingBottom: "1rem" }}
          aria-hidden
        >
          {lines.map((line, i) => {
            if (isSectionTag(line)) {
              return (
                <div key={i} className="char-count-badge" style={LINE_STYLE}>—</div>
              );
            }
            if (hasKanji(line)) {
              return (
                <div key={i} className="char-count-badge" style={LINE_STYLE}></div>
              );
            }
            const mora = countMora(line);
            return (
              <div key={i} className="char-count-badge" style={LINE_STYLE}>
                {line.trim() ? mora : ""}
              </div>
            );
          })}
        </div>

        {/* テキストエリア */}
        <div className="flex-1 relative overflow-hidden">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onMouseUp={handleAiSelection}
            onScroll={handleScroll}
            onKeyUp={(e) => { if (e.shiftKey && e.key === "F2") handleAiSelection(); }}
            className="lyric-editor px-3 overflow-y-auto"
            style={{ height: "100%", paddingTop: "1rem", paddingBottom: "1rem" }}
            placeholder="ひらがな・カタカナで音数確認…"
            spellCheck={false}
          />
        </div>
      </div>

      {/* フッター */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-ink-800 flex-shrink-0">
        <span className="text-xs text-ink-600" style={{ fontFamily: "var(--font-mono)" }}>
          {noteTitle}
        </span>
        <span className="text-xs text-ink-600" style={{ fontFamily: "var(--font-mono)" }}>
          {countChars(content)} 文字 / {countMora(content)} 音
        </span>
      </div>
    </div>
  );
}
