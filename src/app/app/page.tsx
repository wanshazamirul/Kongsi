"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Receipt, Plus, Trash2, Loader2, ScanLine, Bell } from "lucide-react";
import { formatRM } from "@/lib/utils";
import { TopBar } from "@/components/top-bar";
import { BillCardSkeleton } from "@/components/skeleton";
import { ErrorState } from "@/components/error-state";
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

interface Participant {
  id: string;
  name: string;
  amount: number;
  paid: boolean;
}

interface BillStats {
  billId: string;
  paid: number;
  total: number;
  participantCount: number;
  paidCount: number;
}

export default function AppHomePage() {
  const router = useRouter();
  const [bills, setBills] = useState<SavedBill[]>([]);
  const [billStats, setBillStats] = useState<Record<string, BillStats>>({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("kongsi_bills");
      if (stored) setBills(JSON.parse(stored));
    } catch {}
  }, []);

  // Fetch participant data for all bills to compute paid vs remaining
  useEffect(() => {
    if (bills.length === 0) {
      setStatsLoading(false);
      return;
    }
    let cancelled = false;
    async function fetchStats() {
      setStatsError(false);
      const stats: Record<string, BillStats> = {};
      const results = await Promise.allSettled(
        bills.map((b) =>
          fetch(`/api/bills/${b.id}`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        )
      );
      if (cancelled) return;
      let hasData = false;
      results.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value) {
          hasData = true;
          const data = r.value;
          const participants: Participant[] = data.participants || [];
          const youParticipant = participants.find((p: Participant) => p.name === "You");
          const others = youParticipant ? participants.filter((p: Participant) => p.name !== "You") : participants;
          const paidTotal = others.reduce(
            (s: number, p: Participant) => s + (p.paid ? p.amount : 0),
            0
          );
          const total = others.reduce(
            (s: number, p: Participant) => s + p.amount,
            0
          );
          stats[bills[i].id] = {
            billId: bills[i].id,
            paid: paidTotal,
            total: total || (bills[i].total_amount - (youParticipant?.amount || 0)),
            participantCount: others.length,
            paidCount: others.filter((p: Participant) => p.paid).length,
          };
        }
      });
      if (!hasData && bills.length > 0) setStatsError(true);
      setBillStats(hasData ? stats : {});
      setStatsLoading(false);
    }
    fetchStats();
    return () => { cancelled = true; };
  }, [bills, retryKey]);

  // Aggregate across all bills
  const aggregate = (() => {
    const entries = Object.values(billStats);
    const totalAmount = entries.reduce((s, st) => s + st.total, 0);
    const totalPaid = entries.reduce((s, st) => s + st.paid, 0);
    const totalRemaining = totalAmount - totalPaid;
    const totalPaidCount = entries.reduce((s, st) => s + st.paidCount, 0);
    const totalParticipantCount = entries.reduce((s, st) => s + st.participantCount, 0);
    const unpaidBillCount = entries.filter(
      (st) => st.paid < st.total
    ).length;
    return { totalAmount, totalPaid, totalRemaining, totalPaidCount, totalParticipantCount, unpaidBillCount };
  })();

  const fileRef = useRef<HTMLInputElement>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
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
    } catch {}
    setDeleting(false);
  }

  // Donut ring values
  const donutTotal = aggregate.totalAmount || 1;
  const paidPct = aggregate.totalAmount > 0 ? aggregate.totalPaid / aggregate.totalAmount : 0;
  const remainingPct = 1 - paidPct;
  const circumference = 251.2;
  const paidDash = Math.max(paidPct * circumference, 0);
  const remainingDash = Math.max(remainingPct * circumference, 0);

  return (
    <div className="min-h-screen pb-24">
      <TopBar />
      <div className="max-w-3xl mx-auto px-5 flex flex-col gap-8 pt-2">
        {/* Hero Card — slim, gradient, dark in light / grey in dark */}
        <section className="relative rounded-xl p-5 flex flex-col gap-4 overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 shadow-[0px_4px_24px_rgba(15,23,42,0.15)] dark:shadow-[0px_4px_20px_rgba(15,23,42,0.08)]">
          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl dark:bg-primary/15" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-emerald-400/15 rounded-full blur-2xl dark:bg-emerald-400/10" />

          {/* Title — centered */}
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 text-center z-10">
            Total Outstanding
          </h2>

          {/* Amount + Ring — side by side */}
          <div className="flex items-center justify-between z-10 px-2">
            <div className="flex flex-col">
              <p className="text-5xl font-bold tracking-[-0.02em] text-white dark:text-slate-100">
                {formatRM(aggregate.totalRemaining)}
              </p>
              {statsLoading && bills.length > 0 && (
                <div className="flex items-center gap-1 mt-1 text-slate-400 text-xs">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading stats…
                </div>
              )}
            </div>

            {/* Donut ring */}
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" fill="transparent" r="40"
                  strokeWidth="8"
                  className="stroke-white/10 dark:stroke-white/10"
                />
                {paidPct > 0 && (
                  <circle
                    cx="50" cy="50" fill="transparent" r="40"
                    strokeWidth="8"
                    strokeDasharray={`${paidDash} ${circumference - paidDash}`}
                    className="stroke-emerald-400 dark:stroke-emerald-400"
                    strokeLinecap="round"
                  />
                )}
                {remainingPct > 0 && paidPct > 0 && (
                  <circle
                    cx="50" cy="50" fill="transparent" r="40"
                    strokeWidth="8"
                    strokeDasharray={`${remainingDash} ${circumference}`}
                    strokeDashoffset={-paidDash}
                    className="stroke-amber-400 dark:stroke-amber-400"
                    strokeLinecap="round"
                  />
                )}
                {remainingPct >= 1 && (
                  <circle
                    cx="50" cy="50" fill="transparent" r="40"
                    strokeWidth="8"
                    strokeDasharray={`${circumference} ${circumference}`}
                    className="stroke-amber-400 dark:stroke-amber-400"
                    strokeLinecap="round"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-semibold text-white dark:text-slate-100">
                  {statsLoading ? "…" : aggregate.unpaidBillCount}
                </span>
                <span className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-400">
                  {aggregate.unpaidBillCount === 1 ? "Bill" : "Bills"}
                </span>
              </div>
            </div>
          </div>

          {/* Paid count chips — centered below */}
          {!statsLoading && aggregate.totalParticipantCount > 0 && (
            <div className="flex items-center justify-center gap-2 z-10">
              <span className="inline-flex items-center gap-1 bg-emerald-400/15 text-emerald-300 dark:bg-emerald-400/15 dark:text-emerald-300 px-2 py-1 rounded-full text-xs font-semibold">
                {aggregate.totalPaidCount}/{aggregate.totalParticipantCount} paid
              </span>
              {aggregate.unpaidBillCount > 0 && (
                <span className="inline-flex items-center gap-1 bg-white/10 text-slate-300 dark:bg-white/10 dark:text-slate-300 px-2 py-1 rounded-full text-xs font-semibold">
                  {aggregate.unpaidBillCount} {aggregate.unpaidBillCount === 1 ? "bill" : "bills"} left
                </span>
              )}
            </div>
          )}
        </section>

        {/* Quick Actions Grid */}
        <section className="grid grid-cols-3 gap-3 md:gap-4">
          <button
            onClick={() => router.push("/app/create")}
            className="flex flex-col items-center justify-center gap-3 bg-surface-container-lowest p-4 rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] hover:-translate-y-1 transition-all group border border-transparent hover:border-primary/20"
          >
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0px_2px_8px_rgba(70,72,212,0.3)]">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-semibold text-on-surface text-center uppercase tracking-wider">
              Create New Bill
            </span>
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 bg-surface-container-lowest p-4 rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] hover:-translate-y-1 transition-all group border border-transparent hover:border-primary/20"
          >
            <div className="w-12 h-12 rounded-full bg-accent/20 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
              <ScanLine className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-semibold text-on-surface text-center uppercase tracking-wider">
              Upload
            </span>
          </button>
          <button
            onClick={() => {
              if (bills.length > 0) {
                router.push(
                  `/b/${bills[0].id}/dashboard?token=${bills[0].admin_token}`
                );
              }
            }}
            className="flex flex-col items-center justify-center gap-3 bg-surface-container-lowest p-4 rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] hover:-translate-y-1 transition-all group border border-transparent hover:border-primary/20"
          >
            <div className="w-12 h-12 rounded-full bg-secondary/20 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bell className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-semibold text-on-surface text-center uppercase tracking-wider">
              Remind All
            </span>
          </button>
        </section>

        {/* Active Bills List */}
        {statsLoading && bills.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-on-surface">Active Bills</h3>
              <span className="text-xs text-on-surface-variant">Loading...</span>
            </div>
            <div className="flex flex-col gap-3">
              {bills.map((bill) => (
                <BillCardSkeleton key={bill.id} />
              ))}
            </div>
          </section>
        )}

        {statsError && !statsLoading && (
          <ErrorState
            message="Couldn't load bill stats"
            onRetry={() => setRetryKey((k) => k + 1)}
          />
        )}

        {!statsLoading && !statsError && bills.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-on-surface">
                Active Bills
              </h3>
              <button
                onClick={() => router.push("/app/history")}
                className="text-xs font-semibold text-primary hover:underline"
              >
                View All
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {bills.map((bill) => {
                const stats = billStats[bill.id];
                return (
                  <div
                    key={bill.id}
                    className="bg-surface-container-lowest rounded-xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] transition-shadow flex flex-col gap-3 group relative"
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(
                          `/b/${bill.id}/dashboard?token=${bill.admin_token}`
                        )
                      }
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4 items-center">
                          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                            <Receipt className="w-5 h-5 text-on-surface-variant" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-on-surface">
                              {bill.title}
                            </h4>
                            <p className="text-xs text-on-surface-variant">
                              Created{" "}
                              {new Date(
                                bill.created.replace(" ", "T")
                              ).toLocaleDateString("en-MY", {
                                day: "numeric",
                                month: "short",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-start gap-2">
                          <div>
                            <p className="text-sm font-semibold text-primary">
                              {formatRM(bill.total_amount)}
                            </p>
                            {stats ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success-container/20 text-on-success-container">
                                {stats.paidCount}/{stats.participantCount} paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container-high text-on-surface-variant">
                                {formatRM(bill.total_amount)}
                              </span>
                            )}
                          </div>
                          {/* Delete button */}
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
                      {/* Progress bar */}
                      <div className="w-full bg-surface-container-high rounded-full h-2 mt-3">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: stats
                              ? `${(stats.paid / stats.total) * 100}%`
                              : "0%",
                            background: stats
                              ? stats.paid === stats.total
                                ? "var(--success)"
                                : "var(--primary)"
                              : "transparent",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty state */}
        {bills.length === 0 && (
          <section className="flex flex-col items-center gap-4 py-16">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center">
              <Receipt className="w-8 h-8 text-on-surface-variant" />
            </div>
            <p className="text-sm text-on-surface-variant text-center">
              No bills yet. Tap "Create New Bill" above to get started.
            </p>
          </section>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
      />

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
