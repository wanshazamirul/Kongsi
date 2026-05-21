"use client";

import { useState, useEffect } from "react";
import { User, Sun, Moon, Trash2, CreditCard, Shield, Bell, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const [dark, setDark] = useState(false);
  const [billCount, setBillCount] = useState(0);
  const [totalSettled, setTotalSettled] = useState(0);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    try {
      const bills = JSON.parse(localStorage.getItem("kongsi_bills") || "[]");
      setBillCount(bills.length);
      setTotalSettled(bills.reduce((s: number, b: any) => s + (b.total_amount || 0), 0));
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
    setTotalSettled(0);
    toast.success("All data cleared");
  }

  const settingsItems = [
    { icon: CreditCard, label: "Payment Methods", onClick: () => toast.success("Coming soon!") },
    { icon: Shield, label: "Security", onClick: () => toast.success("Coming soon!") },
    { icon: Bell, label: "Notifications", onClick: () => toast.success("Coming soon!") },
    { icon: HelpCircle, label: "Help & Support", onClick: () => toast.success("Coming soon!") },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface shadow-sm flex justify-between items-center h-16 px-5">
        <button className="hover:opacity-80 active:scale-95 text-on-surface-variant">
          <User className="w-5 h-5" />
        </button>
        <div className="text-lg font-bold text-primary">Kongsi</div>
        <div className="w-10" />
      </header>

      <main className="pt-24 px-5 max-w-2xl mx-auto flex flex-col gap-6">
        {/* Profile Header */}
        <section className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-primary-container/20 border-4 border-surface shadow-md flex items-center justify-center">
              <User className="w-16 h-16 text-primary" />
            </div>
            <button
              onClick={toggleTheme}
              className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 shadow-sm hover:opacity-80 active:scale-95 transition-all"
            >
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-on-surface">You</h1>
            <p className="text-sm text-on-surface-variant">Local account</p>
          </div>
        </section>

        {/* Stats Bento */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] flex flex-col gap-1">
            <div className="flex items-center gap-1 text-on-surface-variant">
              <span className="text-lg">💰</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider">Total Settled</span>
            </div>
            <div className="text-xl font-semibold text-primary">RM{totalSettled.toFixed(2)}</div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] flex flex-col gap-1">
            <div className="flex items-center gap-1 text-on-surface-variant">
              <span className="text-lg">📄</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider">Active Bills</span>
            </div>
            <div className="text-xl font-semibold text-success">{billCount}</div>
          </div>
        </section>

        {/* Settings List */}
        <section className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] overflow-hidden">
          <div className="divide-y divide-outline-variant">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                {dark ? <Sun className="w-5 h-5 text-on-surface-variant" /> : <Moon className="w-5 h-5 text-on-surface-variant" />}
                <span className="text-sm text-on-surface">{dark ? "Light Mode" : "Dark Mode"}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-on-surface-variant" />
            </button>
            {settingsItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  <item.icon className="w-5 h-5 text-on-surface-variant" />
                  <span className="text-sm text-on-surface">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant" />
              </button>
            ))}
          </div>
        </section>

        {/* Clear Data */}
        <section className="pb-6">
          <button
            onClick={clearAllData}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl text-error bg-error-container/20 hover:bg-error-container/30 active:scale-[0.98] transition-all text-xs font-semibold uppercase tracking-wider"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </button>
        </section>
      </main>
    </div>
  );
}
