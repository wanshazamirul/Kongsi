"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Receipt } from "lucide-react";

interface Props {
  title?: string;
  backTo?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export function TopBar({ title = "Kongsi", backTo, onBack, right }: Props) {
  const router = useRouter();

  function handleBack() {
    if (onBack) onBack();
    else if (backTo) router.push(backTo);
    else router.back();
  }

  return (
    <header className="sticky top-0 w-full z-50 bg-surface shadow-[0px_4px_20px_rgba(15,23,42,0.05)]">
      <div className="flex justify-between items-center w-full px-5 h-12">
        <button
          onClick={handleBack}
          className="text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-full p-2 -ml-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-primary" />
          <h1 className="text-sm font-bold text-primary">{title}</h1>
        </div>
        {right || <div className="w-10" />}
      </div>
    </header>
  );
}
