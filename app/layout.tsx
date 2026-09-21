import { ClerkProvider } from "@clerk/nextjs";
import { Poppins } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Vertex | Intelligent Learning",
  description: "Search your learning in plain English with Vertex.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`h-full antialiased ${poppins.variable}`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}