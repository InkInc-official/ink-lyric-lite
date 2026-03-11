// セクションタグかどうか判定（行単位）
export function isSectionTag(line: string): boolean {
  return /^\[.*\]$/.test(line.trim());
}

// 日本語の発音数（モーラ数）を計算
export function countMora(text: string): number {
  if (!text.trim()) return 0;
  const lines = text.split("\n");
  const lyricsOnly = lines
    .filter((line) => !isSectionTag(line))
    .join("\n");
  const cleaned = lyricsOnly.replace(/\[.*?\]/g, "").trim();
  if (!cleaned) return 0;
  let count = 0;
  const chars = [...cleaned];
  let i = 0;
  while (i < chars.length) {
    const c = chars[i];
    // 拗音（小文字のひらがな・カタカナ）は前の文字と合わせて1モーラ
    if ("ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮ".includes(c)) {
      i++;
      continue;
    }
    // 日本語文字
    if (/[\u3040-\u30FF\u4E00-\u9FFF\uFF65-\uFF9F]/.test(c)) {
      count++;
    // 半角英字
    } else if (/[a-zA-Z]/.test(c)) {
      count++;
    // 全角英字（Ａ-Ｚ、ａ-ｚ）
    } else if (/[\uFF21-\uFF3A\uFF41-\uFF5A]/.test(c)) {
      count++;
    }
    i++;
  }
  return count;
}

// 行単位のモーラ数（空行は0を返す）
export function countMoraLine(line: string): number {
  if (!line.trim()) return 0;
  if (isSectionTag(line)) return 0;
  return countMora(line);
}

// 文字数（セクションタグ行・スペース除く）
export function countChars(text: string): number {
  const lines = text.split("\n");
  const lyricsOnly = lines
    .filter((line) => !isSectionTag(line))
    .join("\n");
  const cleaned = lyricsOnly.replace(/\[.*?\]/g, "").replace(/\s/g, "");
  return [...cleaned].length;
}

// IDを生成
export function generateId(): string {
  return `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// 日時フォーマット
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
