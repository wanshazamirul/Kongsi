"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, Receipt, Lock, UserPlus } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { Skeleton } from "@/components/skeleton";
import { ErrorState } from "@/components/error-state";
import { getDeviceId } from "@/lib/device-id";

function useContactAvatars() {
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  useEffect(() => {
    try {
      const contacts: { name: string; avatar?: string }[] = JSON.parse(localStorage.getItem("kongsi_contacts") || "[]");
      const map: Record<string, string> = {};
      contacts.forEach((c) => { if (c.avatar) map[c.name] = c.avatar; });
      setAvatars(map);
    } catch {}
  }, []);
  return avatars;
}
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
  line_items?: { name: string; amount: number; paidBy?: string[] }[] | null;
}

export default function PublicBillPage() {
  const { id } = useParams<{ id: string }>();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const contactAvatars = useContactAvatars();
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
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <main className="flex-1 flex items-center justify-center p-5">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-[24px] p-8 flex flex-col items-center gap-6 border border-white/20">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="w-48 h-4" />
              <Skeleton className="w-36 h-6" />
            </div>
            <Skeleton className="w-24 h-3" />
            <Skeleton className="w-40 h-12" />
            <div className="w-full space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 flex justify-between">
                    <Skeleton className="w-24 h-4" />
                    <Skeleton className="w-16 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <ErrorState
          message="Bill not found"
          onRetry={() => window.location.reload()}
        />
        <p className="text-xs text-on-surface-variant text-center -mt-2">The link might be broken or the bill was deleted.</p>
      </div>
    );
  }

  const allPaid = bill.participants.every((p) => p.paid);
  const pastDue = bill.due_date && new Date(bill.due_date) < new Date() && !allPaid;
  const firstUnpaid = bill.participants.find((p) => !p.paid);
  const organizerName = bill.participants[0]?.name || "Someone";

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-surface">
      {/* Ambient Background Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-success-container/20 blur-[120px]" />
      </div>

      <TopBar />

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col items-center justify-center p-5 z-10 relative w-full max-w-md mx-auto">
        {/* Payment Card — Glassmorphism + Tonal Layering */}
        <article className="w-full bg-surface-container-lowest/90 backdrop-blur-xl rounded-[24px] shadow-[0px_10px_30px_rgba(15,23,42,0.1)] overflow-hidden border border-white/20">
          {/* Hero Section */}
          <div className={`p-8 flex flex-col items-center text-center border-b ${pastDue ? "border-destructive/30 bg-destructive/5" : "border-outline-variant"}`}>
            <div className={`w-20 h-20 rounded-full overflow-hidden mb-4 shadow-sm border-2 flex items-center justify-center ${pastDue ? "border-destructive/20 bg-destructive/5" : "border-surface bg-surface-container-high"}`}>
              <Receipt className={`w-10 h-10 ${pastDue ? "text-destructive" : "text-primary"}`} />
            </div>
            <h1 className="text-sm text-on-surface-variant mb-1">
              <strong className="text-on-surface font-semibold">{organizerName}</strong> invited you to pay for
            </h1>
            <h1 className="text-xl font-bold text-on-surface mt-1">{bill.title}</h1>
            {pastDue && (
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/10 text-destructive">
                Overdue
              </span>
            )}
            {bill.description && (
              <p className="text-xs text-on-surface-variant mt-2 max-w-xs">{bill.description}</p>
            )}
            {bill.due_date && (
              <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${pastDue ? "bg-destructive/10 text-destructive" : "bg-surface-container-high text-on-surface-variant"}`}>
                Due {new Date(bill.due_date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
            <div className="mt-6">
              <span className="text-xs text-on-surface-variant uppercase tracking-wider block mb-2">Amount Due</span>
              <div className={`text-5xl font-bold tracking-[-0.02em] ${pastDue ? "text-destructive" : "text-primary"}`}>
                RM{bill.total_amount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Line Items Breakdown */}
          {bill.line_items && bill.line_items.length > 0 && (
            <div className="px-6 pt-5 bg-surface-container-lowest">
              <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">What's on the bill</h2>
              <div className="space-y-1.5 mb-1">
                {bill.line_items.map((li, i) => {
                  const assignees = li.paidBy?.length ? li.paidBy : null;
                  const allNames = bill.participants.map(p => p.name);
                  const isSplitEqually = !assignees || assignees.length === allNames.length;
                  return (
                    <div key={i} className="flex justify-between text-sm">
                      <div>
                        <span className="text-on-surface">{li.name}</span>
                        {assignees && assignees.length > 0 && (
                          <p className="text-[10px] text-on-surface-variant mt-0.5">
                            {isSplitEqually ? "Split equally" : assignees.join(", ")}
                          </p>
                        )}
                      </div>
                      <span className="text-on-surface-variant">RM{li.amount.toFixed(2)}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between text-sm font-semibold border-t border-outline-variant pt-1.5 mt-1">
                  <span className="text-on-surface">Total</span>
                  <span className="text-primary">RM{bill.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

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
                    <div className="w-10 h-10 rounded-full bg-primary-container/20 text-primary flex items-center justify-center overflow-hidden text-sm font-semibold">
                      {contactAvatars[p.name] ? (
                        <img src={contactAvatars[p.name]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        p.name[0].toUpperCase()
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-on-surface">{p.name}</span>
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
