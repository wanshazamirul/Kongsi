"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface Props {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  onBack?: () => void;
}

export function TopBar({ title = "Kongsi", showBack = false, backTo, onBack }: Props) {
  const router = useRouter();

  function handleBack() {
    if (onBack) onBack();
    else if (backTo) router.push(backTo);
    else router.back();
  }

  return (
    <header className="sticky top-0 w-full z-50 bg-surface shadow-[0px_4px_20px_rgba(15,23,42,0.05)]">
      <div className="flex justify-center items-center w-full px-5 h-12 relative">
        {showBack && (
          <button
            onClick={handleBack}
            className="absolute left-5 text-on-surface-variant hover:bg-surface-container-low active:scale-90 transition-all rounded-full p-2"
          >
            <span className="text-sm">←</span>
          </button>
        )}
        <div className="flex items-center gap-2">
          <Image src="/icon.png" alt="Kongsi" width={20} height={20} className="rounded-md" />
          <span className="text-sm font-bold text-primary tracking-tight">{title}</span>
        </div>
      </div>
    </header>
  );
}
