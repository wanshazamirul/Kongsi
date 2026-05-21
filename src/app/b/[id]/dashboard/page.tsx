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
    const text = `Kongsi Bil: ${bill?.title}\nTotal: ${bill ? formatRM(bill.total_amount) : ""}\n\n${url}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
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

  const paidCount = bill.participants.filter((p) => p.paid).length;
  const totalPaid = bill.participants.filter((p) => p.paid).reduce((s, p) => s + p.amount, 0);
  const remaining = bill.total_amount - totalPaid;
  const progress = bill.total_amount > 0 ? (totalPaid / bill.total_amount) * 100 : 0;
  const allPaid = paidCount === bill.participants.length;

  return (
    <div className="min-h-screen max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <a href="/" className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </a>
        <div>
          <h1 className="text-lg font-bold">{bill.title}</h1>
          <p className="text-xs text-muted-foreground">Organizer Dashboard</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Collected</p>
          <p className="text-2xl font-bold text-emerald-400">{formatRM(totalPaid)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Remaining</p>
          <p className={`text-2xl font-bold ${remaining <= 0 ? "text-muted-foreground" : "text-foreground"}`}>
            {formatRM(remaining)}
          </p>
        </Card>
      </div>

      {/* Progress */}
      <Card className="p-4 mb-5">
        <ProgressRing
          progress={progress}
          label="Collection Progress"
          sublabel={`${paidCount}/${bill.participants.length} paid · ${formatRM(totalPaid)}`}
        />
      </Card>

      {/* Participants */}
      <div className="space-y-2 mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Participants ({paidCount}/{bill.participants.length})
        </h2>
        <AnimatePresence>
          {bill.participants.map((p, i) => (
            <motion.div
              key={p.id}
              initial={p.paid ? { scale: 0.9, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: i * 0.05 }}
            >
              <Card className={`p-3 flex items-center justify-between relative overflow-hidden ${p.paid ? "opacity-70 border-emerald-500/20" : ""}`}>
                {p.paid && <PaidStamp />}
                <div className="flex items-center gap-3">
                  {p.paid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    {p.paid && p.paid_at && (
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(p.paid_at.replace(" ", "T")).toLocaleDateString("en-MY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{formatRM(p.amount)}</span>
                  <Badge variant={p.paid ? "default" : "secondary"} className="text-[10px]">
                    {p.paid ? "Paid" : "Pending"}
                  </Badge>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Share buttons */}
      <div className="space-y-2">
        <Button onClick={shareWhatsApp} className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
          <Share2 className="w-4 h-4 mr-2" />
          Share via WhatsApp
        </Button>
        <Button onClick={copyPublicLink} variant="outline" className="w-full h-11 rounded-xl">
          <Copy className="w-4 h-4 mr-2" />
          Copy Public Link
        </Button>
      </div>

      <ConfettiBurst trigger={allPaid} />
      {allPaid && (
        <div className="mt-6 text-center">
          <p className="text-lg font-bold text-emerald-400">All collected!</p>
          <p className="text-xs text-muted-foreground mt-1">Everyone has paid. Bil settle!</p>
        </div>
      )}

      <p className="text-center text-[10px] text-muted-foreground mt-6">
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
