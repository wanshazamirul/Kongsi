"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Share2, Lock, Loader2, Receipt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfettiBurst } from "@/components/confetti-burst";
import { toast } from "sonner";
import { formatRM } from "@/lib/utils";

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
  participants: Participant[];
}

export default function PublicBillPage() {
  const { id } = useParams<{ id: string }>();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [showAllPaid, setShowAllPaid] = useState(false);

  useEffect(() => { loadBill(); }, [id]);

  async function loadBill() {
    const res = await fetch(`/api/bills/${id}`);
    if (res.ok) setBill(await res.json());
    setLoading(false);
  }

  async function confirmPayment(participantId: string) {
    setPayingId(participantId);
    const res = await fetch(`/api/bills/${id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participant_id: participantId }),
    });

    if (res.ok) {
      await loadBill();
      setPaid(true);
      toast.success("Payment confirmed!");
      const updated = await fetch(`/api/bills/${id}`).then((r) => r.json());
      const allPaid = updated.participants.every((p: Participant) => p.paid);
      if (allPaid) setShowAllPaid(true);
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to confirm");
    }
    setPayingId(null);
  }

  function shareBill() {
    const url = window.location.href;
    const text = `Kongsi: ${bill?.title}\nTotal: ${bill ? formatRM(bill.total_amount) : ""}\n\n${url}`;
    if (navigator.share) navigator.share({ title: bill?.title, text, url });
    else { navigator.clipboard.writeText(text); toast.success("Link copied!"); }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!bill) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <Receipt className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">Bill not found</p>
        <p className="text-xs text-muted-foreground">The link might be broken or the bill was deleted.</p>
      </div>
    );
  }

  const allPaid = bill.participants.every((p) => p.paid);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-success-container/30 blur-[120px]" />
      </div>

      <header className="w-full flex justify-center items-center py-4 z-10">
        <div className="font-semibold text-lg text-primary tracking-tight">Kongsi</div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center z-10 w-full max-w-md mx-auto">
        {/* Payment card */}
        <article className="w-full bg-surface-container-lowest/90 backdrop-blur-xl rounded-[24px] shadow-[0px_10px_30px_rgba(15,23,42,0.1)] overflow-hidden border border-white/20">
          {/* Hero */}
          <div className="p-8 flex flex-col items-center text-center border-b border-outline-variant">
            <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-4 shadow-sm">
              <Receipt className="w-10 h-10 text-primary" />
            </div>
            <p className="text-on-surface-variant mb-1">
              <strong className="text-on-surface font-semibold">{bill.participants[0]?.name || "Someone"}</strong> invited you to pay for
            </p>
            <h1 className="text-xl font-bold text-on-surface mt-1">{bill.title}</h1>
            <div className="mt-6">
              <span className="text-xs text-on-surface-variant uppercase tracking-wider block mb-1">Amount Due</span>
              <span className="text-5xl font-bold text-primary">RM{bill.total_amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Split breakdown */}
          <div className="p-6 bg-surface-container-lowest">
            <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Split Breakdown</h2>
            <ul className="space-y-3">
              {bill.participants.map((p) => (
                <li key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-semibold text-sm">
                      {p.name[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-on-surface">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${p.paid ? "text-on-surface-variant line-through" : "text-on-surface"}`}>
                      RM{p.amount.toFixed(2)}
                    </span>
                    {p.paid ? (
                      <span className="px-3 py-1 rounded-full bg-success-container/30 text-success text-[10px] font-semibold flex items-center gap-1">
                        ✓ Paid
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-surface-variant text-on-surface-variant text-[10px] font-semibold flex items-center gap-1">
                        ⏳ Pending
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Action */}
          <div className="p-6 pt-0 bg-surface-container-lowest">
            {!allPaid && !paid && (
              <Button
                onClick={() => {
                  // Pay for first unpaid participant
                  const firstUnpaid = bill.participants.find((p) => !p.paid);
                  if (firstUnpaid) confirmPayment(firstUnpaid.id);
                }}
                disabled={payingId !== null}
                className="w-full h-12 bg-primary hover:opacity-90 text-primary-foreground rounded-xl text-lg font-semibold flex items-center justify-center gap-2 shadow-[0px_4px_12px_rgba(70,72,212,0.3)] hover:shadow-[0px_6px_16px_rgba(70,72,212,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                {payingId ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <span>Confirm Payment</span>
                  </>
                )}
              </Button>
            )}
            {paid && !allPaid && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-success-container text-success mx-auto mb-3 flex items-center justify-center">
                  <span className="text-3xl">✓</span>
                </div>
                <p className="font-bold text-success text-lg">Payment Confirmed!</p>
                <p className="text-sm text-on-surface-variant mt-1">You're all settled up.</p>
              </div>
            )}
            {allPaid && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-success-container text-success mx-auto mb-3 flex items-center justify-center">
                  <span className="text-3xl">🎉</span>
                </div>
                <p className="font-bold text-success text-lg">All Paid Up!</p>
                <p className="text-sm text-on-surface-variant mt-1">Everyone has paid. Bil settle!</p>
              </div>
            )}
            <p className="text-xs text-on-surface-variant text-center mt-4 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              The organizer will be notified instantly
            </p>
          </div>
        </article>
      </main>

      <ConfettiBurst trigger={showAllPaid || allPaid} />
    </div>
  );
}
