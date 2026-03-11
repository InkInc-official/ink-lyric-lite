export interface Note {
  id: string;
  filename: string;
  title: string;
  updatedAt: string;
  content: string;
}

export type SectionTag =
  | "[Main Theme]"
  | "[Intro]"
  | "[Verse]"
  | "[Pre-Chorus]"
  | "[Chorus]"
  | "[Solo]"
  | "[Bridge]"
  | "[Outro]";

export type AiMode = "synonym" | "keyword" | "syllable" | "expand";

export interface AiRequest {
  mode: AiMode;
  text: string;
  context?: {
    targetSyllables?: number;
  };
}

export interface LineData {
  text: string;
  charCount: number;
  syllableCount: number;
}
