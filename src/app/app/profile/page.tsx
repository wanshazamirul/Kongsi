"use client";

import { useState, useEffect } from "react";
import { User, Sun, Moon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ProfilePage() {
  const [dark, setDark] = useState(false);
  const [billCount, setBillCount] = useState(0);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    try {
      const bills = JSON.parse(localStorage.getItem("kongsi_bills") || "[]");
      setBillCount(bills.length);
    } catch {}
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("kongsi-theme", next ? "dark" : "light");
  }

  function clearAllData() {
    if (!confirm("Clear all local data? This can't be undone.")) return;
    localStorage.removeItem("kongsi_bills");
    localStorage.removeItem("kongsi_contacts");
    localStorage.removeItem("kongsi-theme");
    setBillCount(0);
    toast.success("All data cleared");
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-24">
      <h1 className="text-2xl font-bold text-on-surface mb-6">Profile</h1>

      {/* Avatar + Stats */}
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full bg-primary-container/20 text-primary flex items-center justify-center mb-4">
          <User className="w-10 h-10" />
        </div>
        <p className="text-lg font-bold text-on-surface">You</p>
        <p className="text-sm text-on-surface-variant mt-1">{billCount} bills created</p>
      </div>

      {/* Settings */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] divide-y divide-outline-variant">
        <button onClick={toggleTheme} className="w-full p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors rounded-t-xl">
          <span className="text-sm font-semibold text-on-surface flex items-center gap-3">
            {dark ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-on-surface-variant" />}
            {dark ? "Light Mode" : "Dark Mode"}
          </span>
          <span className="text-xs text-on-surface-variant">→</span>
        </button>
        <button onClick={clearAllData} className="w-full p-4 flex items-center justify-between hover:bg-error-container/10 transition-colors rounded-b-xl">
          <span className="text-sm font-semibold text-error flex items-center gap-3">
            <Trash2 className="w-5 h-5" />
            Clear All Data
          </span>
          <span className="text-xs text-on-surface-variant">→</span>
        </button>
      </div>
    </div>
  );
}
