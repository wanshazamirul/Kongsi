"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Share2, Copy, CheckCircle2, Clock, Receipt, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/progress-ring";
import { ConfettiBurst } from "@/components/confetti-burst";
import { PaidStamp } from "@/components/paid-stamp";
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
    const text = `Kongsi: ${bill?.title}\nTotal: ${bill ? formatRM(bill.total_amount) : ""}\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function nudgeParticipant(p: Participant) {
    const url = `${window.location.origin}/b/${id}`;
    const text = `Yo ${p.name}, you still owe RM${p.amount.toFixed(2)} for "${bill?.title}". Please pay here: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    toast.success(`Nudge sent to ${p.name}!`);
  }

  function remindAll() {
    if (!bill) return;
    const unpaid = bill.participants.filter((p) => !p.paid);
    if (unpaid.length === 0) {
      toast.success("Everyone has paid!");
      return;
    }
    const url = `${window.location.origin}/b/${id}`;
    const text = `Reminder: Please pay for "${bill.title}". Here's the link: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    toast.success(`Nudging ${unpaid.length} people...`);
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
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
    <div className="min-h-screen max-w-2xl mx-auto px-5 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <a href="/app" className="p-2 -ml-2 rounded-full hover:bg-surface-container-low transition-colors">
          <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
        </a>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-on-surface">{bill.title}</h1>
          <p className="text-xs text-on-surface-variant">Organizer Dashboard</p>
        </div>
        <button onClick={shareWhatsApp} className="bg-surface-container-low text-primary hover:bg-surface-container-high transition-colors rounded-full p-2 flex items-center gap-2 px-4">
          <Share2 className="w-4 h-4" />
          <span className="text-xs font-bold">Share Link</span>
        </button>
      </div>

      {/* Progress card */}
      <Card className="p-5 bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] mb-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Collected</h2>
            <div className="mt-1">
              <span className="text-3xl font-bold text-primary">RM{totalPaid.toFixed(2)}</span>
              <span className="text-lg text-on-surface-variant font-medium"> / RM{bill.total_amount.toFixed(2)}</span>
            </div>
          </div>
          <ProgressRing progress={progress} label="" />
        </div>
        <div className="w-full bg-surface-container-high rounded-full h-2 mt-4">
          <motion.div
            className="h-2 rounded-full bg-success"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-on-surface-variant">
          <span>{Math.round(progress)}% Collected</span>
          <span>{paidParticipants.length} of {bill.participants.length} Paid</span>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-outline-variant pb-2 mb-4">
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

      {/* Participant list */}
      <div className="space-y-2 mb-6">
        <AnimatePresence mode="popLayout">
          {displayList.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="p-3 flex items-center justify-between bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] relative overflow-hidden">
                {p.paid && <PaidStamp />}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold text-lg">
                    {p.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{p.name}</p>
                    {p.paid && p.paid_at && (
                      <p className="text-[11px] text-on-surface-variant">
                        {new Date(p.paid_at.replace(" ", "T")).toLocaleDateString("en-MY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                    {!p.paid && (
                      <p className="text-sm font-semibold text-error">RM{p.amount.toFixed(2)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.paid ? (
                    <Badge className="bg-success-container text-on-success-container text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Paid
                    </Badge>
                  ) : (
                    <button
                      onClick={() => nudgeParticipant(p)}
                      className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-xs font-semibold hover:opacity-90 transition-opacity active:scale-95"
                    >
                      Nudge
                    </button>
                  )}
                  <span className="text-sm font-medium text-on-surface w-16 text-right">
                    RM{p.amount.toFixed(2)}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mb-6">
        <Button onClick={remindAll} variant="outline" className="flex-1 rounded-xl border-outline-variant text-on-surface-variant hover:text-on-surface">
          Remind All
        </Button>
        <Button onClick={shareWhatsApp} variant="outline" className="flex-1 rounded-xl border-outline-variant text-on-surface-variant hover:text-on-surface">
          <Share2 className="w-4 h-4 mr-1" /> Share
        </Button>
        <Button onClick={copyPublicLink} variant="outline" className="flex-1 rounded-xl border-outline-variant text-on-surface-variant hover:text-on-surface">
          <Copy className="w-4 h-4 mr-1" /> Copy Link
        </Button>
      </div>

      <ConfettiBurst trigger={allPaid} />
      {allPaid && (
        <div className="mt-4 text-center">
          <p className="text-lg font-bold text-success">All collected!</p>
          <p className="text-xs text-on-surface-variant mt-1">Everyone has paid. Bil settle!</p>
        </div>
      )}

      <p className="text-center text-[10px] text-on-surface-variant mt-6 pb-safe">
        Bookmark this page — it's the only way to access this dashboard.
      </p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
