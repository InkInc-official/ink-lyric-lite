"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Save, Pencil, Check, X, FileText, PenLine, BookCheck } from "lucide-react";
import NoteList from "@/components/NoteList";
import DraftEditor from "@/components/DraftEditor";
import LyricEditor from "@/components/LyricEditor";
import { Note } from "@/lib/types";
import { generateId } from "@/lib/utils";

// ============================================================
// localStorage キー
// ============================================================
const LS_NOTES    = "inklyric_notes";
const LS_ACTIVE   = "inklyric_active";

const DRAFT_SEP = "===DRAFT===";
const LYRIC_SEP = "===LYRIC===";

function parseContent(raw: string): { draft: string; lyric: string } {
  const di = raw.indexOf(DRAFT_SEP);
  const li = raw.indexOf(LYRIC_SEP);
  if (di === -1 && li === -1) return { draft: raw, lyric: "" };
  const draft = di !== -1 && li !== -1
    ? raw.slice(di + DRAFT_SEP.length, li).trim()
    : di !== -1 ? raw.slice(di + DRAFT_SEP.length).trim() : "";
  const lyric = li !== -1 ? raw.slice(li + LYRIC_SEP.length).trim() : "";
  return { draft, lyric };
}

function buildContent(draft: string, lyric: string): string {
  return `${DRAFT_SEP}\n${draft}\n${LYRIC_SEP}\n${lyric}`;
}

// ============================================================
// localStorage ユーティリティ
// ============================================================
function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(LS_NOTES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(LS_NOTES, JSON.stringify(notes));
}

// ============================================================
// リサイズフック
// ============================================================
function useResize(initialWidth: number, min: number, max: number, direction: "right" | "left" = "right") {
  const [width, setWidth] = useState(initialWidth);
  const dragging = useRef(false);
  const startX   = useRef(0);
  const startW   = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    startX.current   = e.clientX;
    startW.current   = width;
    document.body.style.cursor     = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta    = e.clientX - startX.current;
      const adjusted = direction === "right" ? delta : -delta;
      setWidth(Math.min(max, Math.max(min, startW.current + adjusted)));
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor     = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, [min, max, direction]);

  return { width, onMouseDown };
}

function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="w-1 flex-shrink-0 bg-ink-800 hover:bg-amber-500/50 active:bg-amber-500 transition-colors cursor-col-resize"
      title="ドラッグで幅を調整"
    />
  );
}

// ============================================================
// Main
// ============================================================
export default function Home() {
  const [notes, setNotes]             = useState<Note[]>([]);
  const [activeNote, setActiveNote]   = useState<Note | null>(null);
  const [draft, setDraft]             = useState("");
  const [lyric, setLyric]             = useState("");
  const [saved, setSaved]             = useState(false);
  const [mounted, setMounted]         = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevDraftRef = useRef<string>("");

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft]     = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [isMobile, setIsMobile]   = useState(false);
  const [activeTab, setActiveTab] = useState<"notes" | "draft" | "lyric">("notes");

  const colA = useResize(176, 120, 300, "right");
  const colC = useResize(280, 160, 520, "left");

  // isMobile判定
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // localStorage はクライアントのみ
  useEffect(() => {
    setMounted(true);
    const stored = loadNotes();
    setNotes(stored);
    const activeId = localStorage.getItem(LS_ACTIVE);
    if (activeId) {
      const note = stored.find((n) => n.id === activeId);
      if (note) {
        const { draft: d, lyric: l } = parseContent(note.content);
        setActiveNote(note);
        setDraft(d);
        setLyric(l || d);
      }
    }
  }, []);

  // ノートをlocalStorageに永続化
  const persistNotes = useCallback((next: Note[]) => {
    setNotes(next);
    saveNotes(next);
  }, []);

  const handleSelect = (note: Note) => {
    const { draft: d, lyric: l } = parseContent(note.content);
    setActiveNote(note);
    setDraft(d);
    setLyric(l || d);
    prevDraftRef.current = d;
    setSaved(false);
    setEditingTitle(false);
    localStorage.setItem(LS_ACTIVE, note.id);
    if (isMobile) setActiveTab("draft");
  };

  const handleNew = () => {
    const id      = generateId();
    const newNote: Note = {
      id,
      filename:  `${id}.txt`,
      title:     "無題",
      updatedAt: new Date().toISOString(),
      content:   buildContent("", ""),
    };
    const next = [newNote, ...notes];
    persistNotes(next);
    setActiveNote(newNote);
    setDraft("");
    setLyric("");
    prevDraftRef.current = "";
    setSaved(false);
    setEditingTitle(false);
    localStorage.setItem(LS_ACTIVE, newNote.id);
    if (isMobile) setActiveTab("draft");
  };

  // ノート内容を更新して保存
  const commitSave = useCallback(
    (noteId: string, draftVal: string, lyricVal: string, title?: string) => {
      setNotes((prev) => {
        const next = prev.map((n) =>
          n.id === noteId
            ? { ...n, content: buildContent(draftVal, lyricVal), title: title ?? n.title, updatedAt: new Date().toISOString() }
            : n
        );
        saveNotes(next);
        return next;
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    []
  );

  const scheduleAutoSave = useCallback(
    (draftVal: string, lyricVal: string, noteId: string, title?: string) => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(() => {
        commitSave(noteId, draftVal, lyricVal, title);
      }, 1500);
    },
    [commitSave]
  );

  const handleDraftChange = (val: string) => {
    const prevLines  = prevDraftRef.current.split("\n");
    const nextLines  = val.split("\n");
    const lyricLines = lyric.split("\n");

    // LCSベースのdiff：B行の追加・削除・変更を正確に検出してCに反映
    const lcs = (a: string[], b: string[]): number[][] => {
      const m = a.length, n = b.length;
      const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
      for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
          dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
      return dp;
    };

    const dp = lcs(prevLines, nextLines);
    const mapping: (number | null)[] = Array(nextLines.length).fill(null);

    let i = prevLines.length, j = nextLines.length;
    while (i > 0 && j > 0) {
      if (prevLines[i-1] === nextLines[j-1]) {
        mapping[j-1] = i-1;
        i--; j--;
      } else if (dp[i-1][j] > dp[i][j-1]) {
        i--;
      } else {
        j--;
      }
    }

    const newLyricLines: string[] = nextLines.map((bLine, ni) => {
      const prevIdx = mapping[ni];
      if (prevIdx === null) return bLine;
      return lyricLines[prevIdx] ?? bLine;
    });

    const newLyric = newLyricLines.join("\n");
    prevDraftRef.current = val;
    setDraft(val);
    setLyric(newLyric);
    setSaved(false);
    if (activeNote) {
      const t = notes.find((n) => n.id === activeNote.id)?.title;
      scheduleAutoSave(val, newLyric, activeNote.id, t);
    }
  };

  const handleLyricChange = (val: string) => {
    setLyric(val);
    setSaved(false);
    if (activeNote) {
      const t = notes.find((n) => n.id === activeNote.id)?.title;
      scheduleAutoSave(draft, val, activeNote.id, t);
    }
  };

  const handleDelete = (id: string) => {
    const next = notes.filter((n) => n.id !== id);
    persistNotes(next);
    if (activeNote?.id === id) {
      setActiveNote(null);
      setDraft("");
      setLyric("");
      localStorage.removeItem(LS_ACTIVE);
    }
  };

  const startEditTitle = () => {
    const t = notes.find((n) => n.id === activeNote?.id)?.title || "無題";
    setTitleDraft(t);
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const commitTitle = () => {
    if (!activeNote || !titleDraft.trim()) return;
    const newTitle = titleDraft.trim();
    setNotes((prev) => {
      const next = prev.map((n) =>
        n.id === activeNote.id ? { ...n, title: newTitle } : n
      );
      saveNotes(next);
      return next;
    });
    setEditingTitle(false);
    commitSave(activeNote.id, draft, lyric, newTitle);
  };

  const cancelEditTitle = () => {
    setEditingTitle(false);
    setTitleDraft("");
  };

  const activeTitle = activeNote
    ? notes.find((n) => n.id === activeNote.id)?.title || "無題"
    : "";

  // SSR対策：マウント前は何も描画しない
  if (!mounted) return null;

  return (
    <div className="flex flex-col bg-ink-950" style={{ height: "100dvh" }}>
      {/* トップバー */}
      <header className="flex items-center justify-between px-5 py-2 border-b border-ink-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <a
            href="https://inkinc-hp.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <h1 className="text-base text-amber-400 tracking-wider" style={{ fontFamily: "var(--font-display)" }}>
              Ink Lyric Lite
            </h1>
            <span className="text-xs text-ink-600 hidden sm:block" style={{ fontFamily: "var(--font-mono)" }}>
              Ink Inc. presents
            </span>
          </a>

          {activeNote && (
            <div className="flex items-center gap-1 ml-2 border-l border-ink-800 pl-3">
              {editingTitle ? (
                <>
                  <input
                    ref={titleInputRef}
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitTitle();
                      if (e.key === "Escape") cancelEditTitle();
                    }}
                    className="bg-ink-900 border border-amber-500 rounded px-2 py-0.5 text-sm text-ink-100 outline-none w-48"
                    style={{ fontFamily: "var(--font-display)" }}
                  />
                  <button onClick={commitTitle} className="p-1 text-amber-400 hover:text-amber-300 transition-colors" title="確定 (Enter)">
                    <Check size={13} />
                  </button>
                  <button onClick={cancelEditTitle} className="p-1 text-ink-500 hover:text-ink-300 transition-colors" title="キャンセル (Esc)">
                    <X size={13} />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm text-ink-300 max-w-xs truncate" style={{ fontFamily: "var(--font-display)" }}>
                    {activeTitle}
                  </span>
                  <button onClick={startEditTitle} className="p-1 text-ink-600 hover:text-amber-400 transition-colors" title="タイトルを編集">
                    <Pencil size={11} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* 保存インジケーター・バージョン */}
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs text-amber-400 border border-amber-500/30 px-3 py-1 rounded" style={{ fontFamily: "var(--font-mono)" }}>
              保存済み
            </span>
          )}
          <span className="text-xs text-ink-700 select-none" style={{ fontFamily: "var(--font-mono)" }}>
            v1.0.7
          </span>
        </div>
      </header>

      {/* ============================================================ */}
      {/* PCレイアウト：3カラム                                        */}
      {/* ============================================================ */}
      {!isMobile && (
        <div className="flex flex-1 overflow-hidden">
          <aside className="flex-shrink-0 overflow-hidden" style={{ width: colA.width }}>
            <NoteList
              notes={notes}
              activeId={activeNote?.id || null}
              onSelect={handleSelect}
              onNew={handleNew}
              onDelete={handleDelete}
            />
          </aside>
          <ResizeHandle onMouseDown={colA.onMouseDown} />
          <main className="flex-1 overflow-hidden min-w-0">
            {activeNote ? (
              <DraftEditor
                content={draft}
                onChange={handleDraftChange}
                noteTitle={activeTitle}
                onAiRequest={() => {}}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-ink-700 gap-3">
                <h2 className="text-2xl text-ink-800" style={{ fontFamily: "var(--font-display)" }}>
                  Ink Lyric Lite
                </h2>
                <p className="text-sm">左からノートを選択するか、新規作成してください</p>
              </div>
            )}
          </main>
          <ResizeHandle onMouseDown={colC.onMouseDown} />
          <aside className="flex-shrink-0 overflow-hidden" style={{ width: colC.width }}>
            {activeNote ? (
              <LyricEditor
                content={lyric}
                onChange={handleLyricChange}
                onAiRequest={() => {}}
              />
            ) : null}
          </aside>
        </div>
      )}

      {/* ============================================================ */}
      {/* スマホレイアウト：タブ切り替え                               */}
      {/* ============================================================ */}
      {isMobile && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* タブコンテンツ */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "notes" && (
              <NoteList
                notes={notes}
                activeId={activeNote?.id || null}
                onSelect={handleSelect}
                onNew={handleNew}
                onDelete={handleDelete}
              />
            )}
            {activeTab === "draft" && (
              activeNote ? (
                <DraftEditor
                  content={draft}
                  onChange={handleDraftChange}
                  noteTitle={activeTitle}
                  onAiRequest={() => {}}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-ink-700 gap-3">
                  <p className="text-sm">まずノートタブでノートを選択してください</p>
                </div>
              )
            )}
            {activeTab === "lyric" && (
              activeNote ? (
                <LyricEditor
                  content={lyric}
                  onChange={handleLyricChange}
                  onAiRequest={() => {}}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-ink-700 gap-3">
                  <p className="text-sm">まずノートタブでノートを選択してください</p>
                </div>
              )
            )}
          </div>

          {/* フッタータブバー */}
          <nav className="flex-shrink-0 flex border-t border-ink-800 bg-ink-950">
            {([
              { tab: "notes", label: "NOTES",  icon: <FileText  size={16} /> },
              { tab: "draft", label: "draft",  icon: <PenLine   size={16} /> },
              { tab: "lyric", label: "final",  icon: <BookCheck size={16} /> },
            ] as const).map(({ tab, label, icon }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors
                  ${activeTab === tab
                    ? "text-amber-400 border-t-2 border-amber-400 -mt-px"
                    : "text-ink-600 hover:text-ink-400"}
                `}
              >
                {icon}
                <span className="text-xs tracking-wider" style={{ fontFamily: "var(--font-mono)" }}>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
