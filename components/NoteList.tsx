"use client";

import { useState, useEffect } from "react";
import { FilePlus, Trash2, FileText, StickyNote } from "lucide-react";
import { Note } from "@/lib/types";

const LS_NOTE_MEMOS = "inklyric_note_memos";

function loadNoteMemos(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LS_NOTE_MEMOS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveNoteMemos(memos: Record<string, string>) {
  localStorage.setItem(LS_NOTE_MEMOS, JSON.stringify(memos));
}

interface NoteListProps {
  notes: Note[];
  activeId: string | null;
  onSelect: (note: Note) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export default function NoteList({
  notes,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: NoteListProps) {
  const [hoverId, setHoverId]     = useState<string | null>(null);
  const [openMemos, setOpenMemos] = useState<Record<string, boolean>>({});
  const [memoMap, setMemoMap]     = useState<Record<string, string>>({});
  const [editMap, setEditMap]     = useState<Record<string, string>>({});

  useEffect(() => {
    setMemoMap(loadNoteMemos());
  }, []);

  const persistMemoMap = (next: Record<string, string>) => {
    setMemoMap(next);
    saveNoteMemos(next);
  };

  const toggleMemo = (id: string) => {
    const willOpen = !openMemos[id];
    setOpenMemos((prev) => ({ ...prev, [id]: willOpen }));
    if (willOpen) {
      setEditMap((prev) => ({ ...prev, [id]: memoMap[id] ?? "" }));
    }
  };

  const handleSaveMemo = (id: string) => {
    const text = editMap[id] ?? "";
    persistMemoMap({ ...memoMap, [id]: text });
  };

  const handleDeleteMemo = (id: string) => {
    const next = { ...memoMap };
    delete next[id];
    persistMemoMap(next);
    setEditMap((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setOpenMemos((prev) => ({ ...prev, [id]: false }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-800">
        <span
          className="text-xs tracking-widest text-ink-400 uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Notes
        </span>
        <button
          onClick={onNew}
          className="p-1.5 rounded text-ink-400 hover:text-amber-400 hover:bg-ink-800 transition-colors"
          title="新規ノート"
        >
          <FilePlus size={15} />
        </button>
      </div>

      {/* ノート一覧 */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-ink-600 gap-2">
            <FileText size={24} />
            <p className="text-xs">ノートがありません</p>
          </div>
        )}
        {notes.map((note) => {
          const hasMemo  = !!memoMap[note.id]?.trim();
          const memoOpen = !!openMemos[note.id];
          const isActive = activeId === note.id;

          return (
            <div key={note.id} className="border-b border-ink-900">
              {/* ノート行 */}
              <div
                onMouseEnter={() => setHoverId(note.id)}
                onMouseLeave={() => setHoverId(null)}
                className={`
                  relative px-3 py-2.5 cursor-pointer transition-colors
                  ${isActive ? "bg-ink-800 border-l-2 border-l-amber-500" : "hover:bg-ink-900"}
                `}
              >
                <div onClick={() => onSelect(note)} className="pr-12">
                  <p
                    className={`text-sm truncate ${isActive ? "text-ink-100" : "text-ink-300"}`}
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {note.title || "無題"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs text-ink-600" style={{ fontFamily: "var(--font-mono)" }}>
                      {new Date(note.updatedAt).toLocaleDateString("ja-JP", {
                        month: "numeric", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                    {hasMemo && (
                      <span className="text-xs text-amber-600/70" style={{ fontFamily: "var(--font-mono)" }}>
                        ※メモあり
                      </span>
                    )}
                  </div>
                </div>

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleMemo(note.id); }}
                    className={`p-1 rounded transition-colors ${memoOpen ? "text-amber-400" : "text-ink-600 hover:text-amber-400"}`}
                    title="ノートメモ"
                  >
                    <StickyNote size={12} />
                  </button>
                  {hoverId === note.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("このノートを削除しますか？")) onDelete(note.id);
                      }}
                      className="p-1 text-ink-600 hover:text-red-400 transition-colors rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* メモパネル */}
              {memoOpen && (
                <div className="px-3 pb-3 pt-1 bg-ink-950 border-t border-ink-800">
                  <textarea
                    value={editMap[note.id] ?? ""}
                    onChange={(e) => setEditMap((prev) => ({ ...prev, [note.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSaveMemo(note.id);
                    }}
                    rows={3}
                    placeholder="このノートへのメモ…"
                    className="w-full bg-ink-900 border border-ink-700 rounded px-2 py-1.5 text-xs text-ink-200 resize-none outline-none focus:border-amber-500 transition-colors placeholder:text-ink-700"
                    style={{ fontFamily: "var(--font-display)" }}
                  />
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={() => handleSaveMemo(note.id)}
                      className="flex-1 py-1 rounded text-xs bg-amber-500 text-ink-950 font-medium hover:bg-amber-400 transition-colors"
                    >
                      保存 (⌘Enter)
                    </button>
                    {hasMemo && (
                      <button
                        onClick={() => handleDeleteMemo(note.id)}
                        className="px-2 py-1 rounded text-xs border border-ink-700 text-ink-500 hover:text-red-400 hover:border-red-400/50 transition-colors"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* フッター */}
      <div className="px-4 py-2 border-t border-ink-800">
        <p className="text-xs text-ink-600" style={{ fontFamily: "var(--font-mono)" }}>
          {notes.length} notes
        </p>
      </div>
    </div>
  );
}
