import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lyric Studio — 作詞支援",
  description: "黒井流・作詞支援アプリケーション",
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
