"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Share2, CheckCircle2, Clock, Coffee, Loader2, Printer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PaidStamp } from "@/components/paid-stamp";
import { ProgressKopi } from "@/components/progress-kopi";
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
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);

  useEffect(() => {
    loadBill();
  }, [id]);

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
      toast.success("Payment confirmed! 🎉");
      checkAllPaid();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to confirm");
    }
    setPayingId(null);
    setSelectedParticipant(null);
  }

  function checkAllPaid() {
    if (!bill) return;
    const allPaid = bill.participants.every((p) => p.paid);
    if (allPaid) {
      toast.success("All paid up! 🎊", { duration: 5000 });
    }
  }

  function shareBill() {
    const url = window.location.href;
    const text = `Kongsi Bil: ${bill?.title}\nTotal: ${bill ? formatRM(bill.total_amount) : ""}\n\n${url}`;
    if (navigator.share) {
      navigator.share({ title: bill?.title, text, url });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Link copied!");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <Coffee className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">Bill not found</p>
        <p className="text-xs text-muted-foreground">The link might be broken or the bill was deleted.</p>
      </div>
    );
  }

  const paidCount = bill.participants.filter((p) => p.paid).length;
  const totalPaid = bill.participants.filter((p) => p.paid).reduce((s, p) => s + p.amount, 0);
  const progress = bill.total_amount > 0 ? (totalPaid / bill.total_amount) * 100 : 0;
  const allPaid = paidCount === bill.participants.length;

  return (
    <div className="min-h-screen max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="mb-3 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Coffee className="w-6 h-6 text-amber-400" />
        </div>
        <h1 className="text-xl font-bold">{bill.title}</h1>
        {bill.description && (
          <p className="text-sm text-muted-foreground mt-1">{bill.description}</p>
        )}
        <p className="text-3xl font-bold mt-3 text-amber-400">{formatRM(bill.total_amount)}</p>
        {bill.due_date && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" />
            Due {new Date(bill.due_date.replace(" ", "T")).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}
      </div>

      {/* Progress */}
      <Card className="p-4 mb-5">
        <ProgressKopi
          progress={progress}
          label="Collection Progress"
          sublabel={`${paidCount}/${bill.participants.length} paid · ${formatRM(totalPaid)}`}
        />
      </Card>

      {/* Participants */}
      <div className="space-y-2 mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Participants</h2>
        <AnimatePresence>
          {bill.participants.map((p) => (
            <motion.div
              key={p.id}
              initial={p.paid ? { scale: 0.9, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Card className={`p-3 flex items-center justify-between transition-all relative overflow-hidden ${p.paid ? "opacity-70 border-green-500/20" : ""}`}>
                {p.paid && <PaidStamp />}
                <div className="flex items-center gap-3">
                  {p.paid ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${p.paid ? "line-through text-muted-foreground" : ""}`}>
                      {p.name}
                    </p>
                    {p.paid && p.paid_at && (
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(p.paid_at.replace(" ", "T")).toLocaleDateString("en-MY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{formatRM(p.amount)}</span>
                  {!p.paid && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs rounded-lg border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                      onClick={() => setSelectedParticipant(p.id)}
                      disabled={payingId === p.id}
                    >
                      {payingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Pay"}
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <ConfettiBurst trigger={allPaid} />

      {/* Share button */}
      <Button onClick={shareBill} className="w-full h-11 rounded-xl" variant="outline">
        <Share2 className="w-4 h-4 mr-2" />
        Share via WhatsApp
      </Button>

      <p className="text-center text-[10px] text-muted-foreground mt-4">
        Powered by Kongsi — Split bills, not friendships.
      </p>

      {/* Confirm payment dialog (simple inline) */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="p-6 max-w-sm w-full text-center space-y-4">
            <p className="text-sm">
              Confirm payment for{" "}
              <span className="font-semibold">
                {bill.participants.find((p) => p.id === selectedParticipant)?.name}
              </span>
              ?
            </p>
            <p className="text-xs text-muted-foreground">
              This is a simulated payment. No real money will be transferred.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedParticipant(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
                onClick={() => confirmPayment(selectedParticipant)}
                disabled={payingId === selectedParticipant}
              >
                {payingId === selectedParticipant ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
