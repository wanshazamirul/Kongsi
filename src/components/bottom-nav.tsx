"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { House, Receipt, ScanLine, Users, User } from "lucide-react";

const TABS = [
  { href: "/app", icon: House, label: "Home" },
  { href: "/app/history", icon: Receipt, label: "Bills" },
  null, // Scan — rendered separately, prominent
  { href: "/app/friends", icon: Users, label: "Friends" },
  { href: "/app/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      sessionStorage.setItem("kongsi_scan_image", reader.result as string);
      router.push("/app/scan");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  if (pathname.startsWith("/b/")) return null;

  const isActive = (href: string) => pathname === href || (href === "/app" && pathname === "/app");

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 pb-safe bg-surface shadow-[0px_-4px_20px_rgba(15,23,42,0.05)] rounded-t-xl transition-colors">
        {TABS.map((tab, i) => {
          // Scan button
          if (!tab) {
            return (
              <button
                key="scan"
                onClick={() => fileRef.current?.click()}
                className="relative -mt-6 flex flex-col items-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary hover:opacity-90 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 transition-all active:scale-95">
                  <ScanLine className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-semibold mt-1 text-on-surface-variant uppercase tracking-wider">Scan</span>
              </button>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center rounded-full px-4 py-1 hover:bg-surface-container-high transition-all ${
                isActive(tab.href)
                  ? "bg-success-container/30 text-on-success-container"
                  : "text-on-surface-variant"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold mt-1 uppercase tracking-wider">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
