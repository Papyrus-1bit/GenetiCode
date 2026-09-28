import type { Metadata } from "next";
import "./globals.css";
import "../styles/legacy.css";

export const metadata: Metadata = {
  title: "Родословная — семейное дерево",
  description: "Личное дерево семьи Сивченковых",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
