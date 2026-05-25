"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Receipt, Trash2, Loader2 } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatRM } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    try { setBills(JSON.parse(localStorage.getItem("kongsi_bills") || "[]")); } catch {}
  }, []);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const bill = bills.find((b) => b.id === deleteId);
      await fetch(`/api/bills/${deleteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_token: bill?.admin_token || "" }),
      }).catch(() => {});
      const updated = bills.filter((b) => b.id !== deleteId);
      setBills(updated);
      localStorage.setItem("kongsi_bills", JSON.stringify(updated));
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete bill");
    }
    setDeleting(false);
  }

  const totalOutstanding = bills.reduce((s, b) => s + b.total_amount, 0);

  if (bills.length === 0) {
    return (
      <div className="min-h-screen pb-24">
        <TopBar />
        <main className="px-5 max-w-3xl mx-auto">
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
      <TopBar />

      <main className="px-5 max-w-3xl mx-auto">
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
            {formatRM(totalOutstanding)}
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
              className="bg-surface-container-lowest rounded-xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] active:scale-[0.98] transition-transform cursor-pointer border border-transparent hover:border-outline-variant group"
            >
              <div onClick={() => router.push(`/b/${bill.id}/dashboard?token=${bill.admin_token}`)}>
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
                  <div className="flex items-start gap-2">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-on-surface">{formatRM(bill.total_amount)}</div>
                      <div className="text-[10px] font-semibold text-on-surface-variant uppercase">Total</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(bill.id);
                      }}
                      className="p-1.5 rounded-lg text-on-surface-variant/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-primary w-[0%] rounded-full" />
                </div>
                <div className="mt-2 text-right text-[10px] font-semibold text-on-surface-variant">
                  Tap to view dashboard
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bill</DialogTitle>
            <DialogDescription>
              This will permanently delete this bill and all participant data.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-center">
            <button
              onClick={() => setDeleteId(null)}
              disabled={deleting}
              className="h-9 px-4 rounded-lg border border-outline-variant text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="h-9 px-4 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
