"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Receipt } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { formatRM } from "@/lib/utils";

interface SavedBill {
  id: string;
  title: string;
  total_amount: number;
  created: string;
  admin_token: string;
}

export default function BillsPage() {
  const router = useRouter();
  const [bills, setBills] = useState<SavedBill[]>([]);
  const [tab, setTab] = useState<"active" | "past">("active");

  useEffect(() => {
    try { setBills(JSON.parse(localStorage.getItem("kongsi_bills") || "[]")); } catch {}
  }, []);

  const totalOutstanding = bills.reduce((s, b) => s + b.total_amount, 0);

  if (bills.length === 0) {
    return (
      <div className="min-h-screen pb-24">
        <TopBar />
        <main className="pt-16 px-5 max-w-3xl mx-auto">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-2xl font-bold text-on-surface tracking-tight">Bills</h2>
            <Button onClick={() => router.push("/app/create")} className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-1 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] active:scale-95">
              <Plus className="w-4 h-4" /> New Bill
            </Button>
          </div>
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center">
              <Receipt className="w-8 h-8 text-on-surface-variant" />
            </div>
            <p className="text-sm text-on-surface-variant text-center">No bills yet. Create one to get started.</p>
            <Button onClick={() => router.push("/app/create")} className="bg-primary text-primary-foreground rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Create Bill
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Top App Bar */}
      <TopBar />

      <main className="pt-24 px-5 max-w-3xl mx-auto">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-2xl font-bold text-on-surface tracking-tight">Bills</h2>
          <Button onClick={() => router.push("/app/create")} className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-1 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] active:scale-95">
            <Plus className="w-4 h-4" /> New Bill
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant mb-6">
          <button
            onClick={() => setTab("active")}
            className={`flex-1 pb-3 text-sm font-semibold ${tab === "active" ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            Active
          </button>
          <button
            onClick={() => setTab("past")}
            className={`flex-1 pb-3 text-sm font-semibold ${tab === "past" ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            Past
          </button>
        </div>

        {/* Summary Widget */}
        <div className="bg-surface-container-lowest rounded-xl p-4 mb-6 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-outline-variant relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex justify-between items-center mb-3 relative z-10">
            <span className="text-sm text-on-surface-variant">Total Outstanding</span>
            <span className="bg-error-container/30 text-error px-2 py-1 rounded-full text-[10px] font-semibold">Across {bills.length} {bills.length === 1 ? "bill" : "bills"}</span>
          </div>
          <div className="text-4xl font-bold text-on-surface tracking-[-0.02em] mb-1 relative z-10">
            RM{totalOutstanding.toFixed(2)}
          </div>
          <div className="text-sm text-on-surface-variant relative z-10">
            Active bills
          </div>
        </div>

        {/* Bills List */}
        <div className="space-y-4">
          {bills.map((bill) => (
            <div
              key={bill.id}
              onClick={() => router.push(`/b/${bill.id}/dashboard?token=${bill.admin_token}`)}
              className="bg-surface-container-lowest rounded-xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] active:scale-[0.98] transition-transform cursor-pointer border border-transparent hover:border-outline-variant group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary group-hover:bg-primary/5 transition-colors">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-on-surface leading-tight">{bill.title}</h3>
                    <p className="text-xs text-on-surface-variant">
                      {new Date(bill.created.replace(" ", "T")).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-on-surface">{formatRM(bill.total_amount)}</div>
                  <div className="text-[10px] font-semibold text-on-surface-variant uppercase">Total</div>
                </div>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                <div className="h-full bg-primary w-[0%] rounded-full" />
              </div>
              <div className="mt-2 text-right text-[10px] font-semibold text-on-surface-variant">
                Tap to view dashboard
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
