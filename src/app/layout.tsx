import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/bottom-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kongsi — Split Bills, Not Friendships",
  description: "Malaysian-style split bill tracker. Scan receipts, split bills, share via WhatsApp. No login needed.",
  openGraph: {
    title: "Kongsi — Split Bills, Not Friendships",
    description: "Scan receipts, split bills, share via WhatsApp.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <main className="min-h-screen pb-20">{children}</main>
        <BottomNav />
        <Toaster />
      </body>
    </html>
  );
}
