"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Receipt, ScanLine, Clock, Coffee } from "lucide-react";

const navItems = [
  { href: "/", label: "Bills", icon: Receipt },
  { href: "/history", label: "History", icon: Clock },
  { href: "/scan", label: "Scan", icon: ScanLine, primary: true },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide on public bill pages and dashboard
  if (pathname.startsWith("/b/")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" || pathname === "/create" : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -mt-6 flex flex-col items-center"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                  isActive
                    ? "bg-amber-500 text-black scale-105"
                    : "bg-amber-500/90 text-black hover:scale-105"
                }`}>
                  <Icon className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-medium mt-1 text-muted-foreground">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${
                isActive ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
