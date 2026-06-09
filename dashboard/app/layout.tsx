import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "سند — Hajj Health Command",
  description: "Hajj Pilgrim Health Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}
