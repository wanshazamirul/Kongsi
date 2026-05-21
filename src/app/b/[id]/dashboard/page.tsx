"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Share2, CheckCircle2, Clock, Receipt, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatRM } from "@/lib/utils";
import { TopBar } from "@/components/top-bar";

interface Participant {
  id: string;
  name: string;
  amount: number;
  paid: boolean;
  paid_at: string | null;
}

interface Bill {
  id: string;
  title: string;
  total_amount: number;
  description: string;
  due_date: string;
  created: string;
  admin_token: string;
  participants: Participant[];
}

function DashboardContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const isNew = searchParams.get("created") === "true";

  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"unpaid" | "paid">("unpaid");

  useEffect(() => {
    if (token) loadDashboard();
  }, [id, token]);

  async function loadDashboard() {
    const res = await fetch(`/api/bills/${id}/dashboard?token=${token}`);
    if (res.ok) {
      setBill(await res.json());
      if (isNew) toast.success("Bill created! Share the link with your friends.");
    } else {
      const err = await res.json();
      setError(err.error || "Failed to load");
    }
    setLoading(false);
  }

  function copyPublicLink() {
    const url = `${window.location.origin}/b/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Public link copied!");
  }

  function shareWhatsApp() {
    const url = `${window.location.origin}/b/${id}`;
    const text = `Kongsi: ${bill?.title}\nTotal: ${bill ? formatRM(bill.total_amount) : ""}\n\nPay here: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function nudgeParticipant(p: Participant) {
    const url = `${window.location.origin}/b/${id}`;
    const text = `Yo ${p.name}, you still owe RM${p.amount.toFixed(2)} for "${bill?.title}". Please pay here: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    toast.success(`Nudge sent to ${p.name}!`);
  }

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <Receipt className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">Missing admin token</p>
        <p className="text-xs text-muted-foreground">Use the full dashboard link from when you created the bill.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (error || !bill) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <Receipt className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">{error || "Bill not found"}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  const paidParticipants = bill.participants.filter((p) => p.paid);
  const unpaidParticipants = bill.participants.filter((p) => !p.paid);
  const totalPaid = paidParticipants.reduce((s, p) => s + p.amount, 0);
  const remaining = bill.total_amount - totalPaid;
  const progress = bill.total_amount > 0 ? (totalPaid / bill.total_amount) * 100 : 0;
  const allPaid = paidParticipants.length === bill.participants.length;
  const displayList = tab === "unpaid" ? unpaidParticipants : paidParticipants;

  return (
    <div className="min-h-screen pb-24">
      <TopBar />

      <main className="max-w-2xl mx-auto px-5 pb-8 flex flex-col gap-8">
        {/* Title */}
        <section className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-bold text-on-surface tracking-[-0.01em]">{bill.title}</h2>
          <p className="text-sm text-on-surface-variant flex items-center gap-2">
            <span className="text-lg">📅</span>
            Organized by You
          </p>
        </section>

        {/* Progress Card */}
        <section className="bg-surface-container-lowest rounded-xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Collected</span>
              <div className="mt-1">
                <span className="text-4xl font-bold text-primary tracking-[-0.02em]">RM{totalPaid.toFixed(0)}</span>
                <span className="text-lg text-on-surface-variant font-medium"> / RM{bill.total_amount.toFixed(0)}</span>
              </div>
            </div>
            <button
              onClick={shareWhatsApp}
              className="bg-surface-container-low text-primary hover:bg-surface-container-high transition-colors rounded-full px-4 py-2 flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-xs font-bold">Share Link</span>
            </button>
          </div>
          <div className="w-full">
            <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-success"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-semibold text-on-surface-variant uppercase">
              <span>{Math.round(progress)}% Collected</span>
              <span>{paidParticipants.length} of {bill.participants.length} Paid</span>
            </div>
          </div>
        </section>

        {/* Tabs & Lists */}
        <section className="flex flex-col gap-4">
          <div className="flex gap-4 border-b border-outline-variant pb-2">
            <button
              onClick={() => setTab("unpaid")}
              className={`text-sm font-semibold pb-1 px-2 transition-colors ${tab === "unpaid" ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              Unpaid ({unpaidParticipants.length})
            </button>
            <button
              onClick={() => setTab("paid")}
              className={`text-sm font-semibold pb-1 px-2 transition-colors ${tab === "paid" ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              Paid ({paidParticipants.length})
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {displayList.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="bg-surface-container-lowest rounded-xl p-3 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold text-lg">
                        {p.name[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-on-surface">{p.name}</span>
                        <span className={`text-sm ${p.paid ? "text-on-surface-variant line-through" : "text-error font-semibold"}`}>
                          RM{p.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {!p.paid ? (
                      <button
                        onClick={() => nudgeParticipant(p)}
                        className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-xs font-semibold hover:opacity-90 transition-opacity active:scale-95"
                      >
                        Nudge
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-success-container/20 text-success text-[10px] font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Paid
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {displayList.length === 0 && (
              <p className="text-center text-sm text-on-surface-variant py-8">
                {tab === "unpaid" ? "Everyone has paid!" : "No payments yet."}
              </p>
            )}
          </div>
        </section>

        {allPaid && (
          <div className="text-center py-4">
            <p className="text-lg font-bold text-success">All collected!</p>
            <p className="text-xs text-on-surface-variant mt-1">Everyone has paid. Bil settle!</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
