import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kongsi — Split Bills, Not Friendships",
  description: "Malaysian-style split bill tracker. Create a bill, share via WhatsApp, track who paid. No login needed.",
  openGraph: {
    title: "Kongsi — Split Bills, Not Friendships",
    description: "Create a bill, share via WhatsApp, track who paid.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
