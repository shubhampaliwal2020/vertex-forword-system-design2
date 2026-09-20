import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vertex | Intelligent Learning",
  description: "Search your learning in plain English with Vertex.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
