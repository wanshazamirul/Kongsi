"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Receipt, ScanLine, Clock } from "lucide-react";

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
    // Reset so same file can be re-selected
    e.target.value = "";
  }

  // Hide on public bill pages
  if (pathname.startsWith("/b/")) return null;

  const isActive = (href: string) => {
    if (href === "/app") return pathname === "/app" || pathname === "/app/create";
    return pathname.startsWith(href);
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-around max-w-lg mx-auto h-16">
          {/* Bills */}
          <Link
            href="/app"
            className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${
              isActive("/app") ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Receipt className="w-5 h-5" />
            <span className="text-[10px] font-medium">Bills</span>
          </Link>

          {/* Scan — center, prominent */}
          <button
            onClick={() => fileRef.current?.click()}
            className="relative -mt-6 flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white dark:text-black flex items-center justify-center shadow-lg transition-all active:scale-95">
              <ScanLine className="w-7 h-7" />
            </div>
            <span className="text-[10px] font-medium mt-1 text-muted-foreground">
              Scan
            </span>
          </button>

          {/* History */}
          <Link
            href="/app/history"
            className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${
              isActive("/app/history") ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px] font-medium">History</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
