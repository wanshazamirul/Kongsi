"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { House, Receipt, ScanLine, Users, User } from "lucide-react";

const TABS = [
  { href: "/app", icon: House, label: "Home" },
  { href: "/app/history", icon: Receipt, label: "Bills" },
  null, // Scan placeholder
  { href: "/app/friends", icon: Users, label: "Friends" },
  { href: "/app/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname.startsWith("/b/")) return null;

  const isActive = (href: string) => pathname === href || (href === "/app" && pathname === "/app");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface shadow-[0px_-4px_20px_rgba(15,23,42,0.05)] rounded-t-xl pb-safe">
      <div className="relative flex items-center h-16">
        {TABS.map((tab, i) => {
          // Center scan button — absolutely positioned
          if (!tab) {
            return (
              <div key="scan" className="flex-1 flex justify-center relative">
                <button
                  onClick={() => router.push("/app/scan?mode=camera")}
                  className="absolute -top-8 left-1/2 -translate-x-1/2 w-14 h-14 rounded-2xl bg-primary hover:opacity-90 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 transition-all active:scale-90"
                >
                  <ScanLine className="w-7 h-7" />
                </button>
              </div>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 active:scale-90 transition-all ${
                isActive(tab.href)
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
