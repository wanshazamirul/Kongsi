"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, Receipt, Lock, UserPlus } from "lucide-react";
import { getDeviceId } from "@/lib/device-id";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
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
  const [showAllPaid, setShowAllPaid] = useState(false);
  const [paid, setPaid] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollName, setEnrollName] = useState("");
  const [enrolled, setEnrolled] = useState(false);

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
      toast.success("Payment confirmed!");
      const updated = await fetch(`/api/bills/${id}`).then((r) => r.json());
      if (updated.participants.every((p: Participant) => p.paid)) setShowAllPaid(true);
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to confirm");
    }
    setPayingId(null);
  }

  async function enrollUser() {
    if (!enrollName.trim()) return;
    setEnrolling(true);
    try {
      const deviceId = getDeviceId();
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId, name: enrollName.trim() }),
      });
      toast.success("You're enrolled! Next time we'll know it's you.");
      setEnrolled(true);
    } catch {
      toast.error("Couldn't enroll. But you're all paid up!");
    }
    setEnrolling(false);
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
  const firstUnpaid = bill.participants.find((p) => !p.paid);
  const organizerName = bill.participants[0]?.name || "Someone";

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-surface">
      {/* Ambient Background Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-success-container/20 blur-[120px]" />
      </div>

      {/* Minimal Brand Header */}
      <header className="w-full flex justify-center items-center py-4 z-10 relative">
        <div className="text-lg font-bold text-primary tracking-tight">Kongsi</div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col items-center justify-center p-5 z-10 relative w-full max-w-md mx-auto">
        {/* Payment Card — Glassmorphism + Tonal Layering */}
        <article className="w-full bg-surface-container-lowest/90 backdrop-blur-xl rounded-[24px] shadow-[0px_10px_30px_rgba(15,23,42,0.1)] overflow-hidden border border-white/20">
          {/* Hero Section */}
          <div className="p-8 flex flex-col items-center text-center border-b border-outline-variant">
            <div className="w-20 h-20 rounded-full overflow-hidden mb-4 shadow-sm border-2 border-surface flex items-center justify-center bg-surface-container-high">
              <Receipt className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-sm text-on-surface-variant mb-1">
              <strong className="text-on-surface font-semibold">{organizerName}</strong> invited you to pay for
            </h1>
            <h1 className="text-xl font-bold text-on-surface mt-1">{bill.title}</h1>
            <div className="mt-6">
              <span className="text-xs text-on-surface-variant uppercase tracking-wider block mb-2">Amount Due</span>
              <div className="text-5xl font-bold text-primary tracking-[-0.02em]">
                RM{bill.total_amount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Split Breakdown */}
          <div className="p-6 bg-surface-container-lowest">
            <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4">Split Breakdown</h2>
            <ul className="flex flex-col gap-3">
              {bill.participants.map((p) => (
                <li
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                    p.name === "You" || p === firstUnpaid ? "bg-surface-container-low" : "hover:bg-surface-container-lowest"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-container/20 text-primary flex items-center justify-center text-sm font-semibold">
                      {p.name[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-on-surface">{p.name}</span>
                      {p.name === "You" && (
                        <span className="text-[10px] text-primary ml-1">(Me)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${p.paid ? "text-on-surface-variant line-through decoration-outline" : "text-on-surface"}`}>
                      RM{p.amount.toFixed(2)}
                    </span>
                    {p.paid ? (
                      <span className="px-3 py-1 rounded-full bg-success-container/20 text-success text-[10px] font-semibold flex items-center gap-1">
                        <span>✓</span> Paid
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

          {/* Action Area */}
          <div className="p-6 pt-0 bg-surface-container-lowest">
            {!allPaid && (
              <>
                <Button
                  onClick={() => firstUnpaid && confirmPayment(firstUnpaid.id)}
                  disabled={payingId !== null}
                  className="w-full h-12 bg-primary hover:opacity-90 text-primary-foreground rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-[0px_4px_12px_rgba(70,72,212,0.3)] hover:shadow-[0px_6px_16px_rgba(70,72,212,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all"
                >
                  {payingId ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      <span>Confirm Payment</span>
                    </>
                  )}
                </Button>
                <p className="text-xs text-on-surface-variant text-center mt-4 flex items-center justify-center gap-1 opacity-80">
                  <Lock className="w-3 h-3" />
                  Once confirmed, {organizerName} will be notified instantly.
                </p>

                {/* Enrollment — shown after payment */}
                {paid && !enrolled && (
                  <div className="mt-6 pt-6 border-t border-outline-variant">
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3 text-center">
                      Want to save your info for next time?
                    </p>
                    <div className="flex gap-2">
                      <input
                        value={enrollName}
                        onChange={(e) => setEnrollName(e.target.value)}
                        placeholder="Your name"
                        className="flex-1 h-10 bg-surface-container-lowest border border-outline-variant rounded-xl px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        onKeyDown={(e) => e.key === "Enter" && enrollUser()}
                      />
                      <button
                        onClick={enrollUser}
                        disabled={enrolling || !enrollName.trim()}
                        className="h-10 px-4 bg-primary text-primary-foreground rounded-xl text-sm font-semibold flex items-center gap-1 disabled:opacity-50 active:scale-95 transition-all"
                      >
                        {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Enroll</>}
                      </button>
                    </div>
                    <p className="text-[10px] text-on-surface-variant text-center mt-2">No password. Just your name. Tied to this device.</p>
                  </div>
                )}
              </>
            )}
            {allPaid && (
              <div className="text-center py-2">
                <p className="text-lg font-bold text-success">All Paid Up!</p>
                <p className="text-xs text-on-surface-variant mt-1">Everyone has paid. Bil settle!</p>
              </div>
            )}
          </div>
        </article>
      </main>

      <ConfettiBurst trigger={showAllPaid || allPaid} />
    </div>
  );
}
