import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
title: "Ink Lyric Lite",
description: "AI音楽生成のための作詞支援アプリ | Ink Inc.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
