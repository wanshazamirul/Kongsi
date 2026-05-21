"use client";

import Image from "next/image";

interface Props {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function TopBar({ title = "Kongsi", showBack = false, onBack }: Props) {
  return (
    <header className="sticky top-0 w-full z-50 bg-surface shadow-[0px_4px_20px_rgba(15,23,42,0.05)]">
      <div className="flex items-center w-full px-5 h-14">
        {showBack && (
          <button
            onClick={onBack}
            className="mr-3 text-on-surface-variant hover:bg-surface-container-low active:scale-90 transition-all rounded-full p-1.5 -ml-1.5"
          >
            <span className="text-lg leading-none">←</span>
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <Image src="/icon.png" alt="Kongsi" width={22} height={22} className="rounded-md" />
          <span className="text-lg font-bold text-primary tracking-tight">{title}</span>
        </div>
      </div>
    </header>
  );
}
