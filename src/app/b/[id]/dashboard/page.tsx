"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Share2, CheckCircle2, Clock, Receipt, Loader2, Upload, Copy, ImageIcon, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatRM } from "@/lib/utils";
import { TopBar } from "@/components/top-bar";

function useContactAvatars() {
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  useEffect(() => {
    try {
      const contacts: { name: string; avatar?: string }[] = JSON.parse(localStorage.getItem("kongsi_contacts") || "[]");
      const map: Record<string, string> = {};
      contacts.forEach((c) => { if (c.avatar) map[c.name] = c.avatar; });
      // Fallback for "You" from profile avatar
      if (!map["You"]) {
        const profileAvatar = localStorage.getItem("kongsi_avatar");
        if (profileAvatar) map["You"] = profileAvatar;
      }
      setAvatars(map);
    } catch {}
  }, []);
  return avatars;
}

interface Participant {
  id: string;
  name: string;
  amount: number;
  paid: boolean;
  paid_at: string | null;
  payment_token?: string;
  proof_image?: string;
  status?: string;
}

interface Bill {
  id: string;
  title: string;
  total_amount: number;
  description: string;
  due_date: string;
  created: string;
  admin_token: string;
  admin_qr?: string;
  participants: Participant[];
}

function DashboardContent() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const isNew = searchParams.get("created") === "true";

  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contactAvatars = useContactAvatars();
  const [tab, setTab] = useState<"unpaid" | "pending" | "paid">("unpaid");
  const [qrUploading, setQrUploading] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [adminQr, setAdminQr] = useState<string | null>(null);
  const qrFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (token) loadDashboard();
  }, [id, token]);

  async function loadDashboard() {
    const res = await fetch(`/api/bills/${id}/dashboard?token=${token}`);
    if (res.ok) {
      const data = await res.json();
      setBill(data);
      if (data.admin_qr) setAdminQr(data.admin_qr);
      if (isNew) toast.success("Bill created! Share the link with your friends.");
    } else {
      const err = await res.json();
      setError(err.error || "Failed to load");
    }
    setLoading(false);
  }

  async function handleQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !bill) return;
    setQrUploading(true);
    try {
      // Resize QR to max 512px, compress aggressively — QR codes are small
      const bitmap = await createImageBitmap(file);
      const maxDim = 512;
      let { width, height } = bitmap;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();
      const base64 = canvas.toDataURL("image/webp", 0.6);
      const res = await fetch(`/api/bills/${id}/qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_image: base64, admin_token: token }),
      });
      if (res.ok) {
        setAdminQr(base64);
        toast.success("QR uploaded!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Upload failed");
      }
    } catch { toast.error("Failed to process image"); }
    setQrUploading(false);
    e.target.value = "";
  }

  async function approveParticipant(p: Participant) {
    setApproving(p.id);
    const res = await fetch(`/api/bills/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participant_id: p.id, admin_token: token }),
    });
    if (res.ok) {
      toast.success(`Approved ${p.name}!`);
      loadDashboard();
    } else {
      toast.error("Failed to approve");
    }
    setApproving(null);
  }

  async function rejectParticipant(p: Participant) {
    setApproving(p.id);
    const res = await fetch(`/api/bills/${id}/approve`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participant_id: p.id, admin_token: token }),
    });
    if (res.ok) {
      toast.success(`Reverted ${p.name}`);
      loadDashboard();
    } else {
      toast.error("Failed to revert");
    }
    setApproving(null);
  }

  function copyParticipantLink(p: Participant) {
    const url = `${window.location.origin}/b/${id}/pay/${p.id}?token=${p.payment_token || ""}`;
    navigator.clipboard.writeText(url);
    toast.success(`Link copied for ${p.name}!`);
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

  const hasYou = bill.participants.some((p) => p.name === "You");
  const others = hasYou ? bill.participants.filter((p) => p.name !== "You") : bill.participants;
  const pendingParticipants = others.filter((p) => !p.paid && p.status === "pending");
  const unpaidParticipants = others.filter((p) => !p.paid && p.status !== "pending");
  const paidParticipants = others.filter((p) => p.paid || p.status === "paid");
  const totalPaid = paidParticipants.reduce((s, p) => s + p.amount, 0);
  const othersTotal = others.reduce((s, p) => s + p.amount, 0);
  const progress = othersTotal > 0 ? (totalPaid / othersTotal) * 100 : 0;
  const allPaid = paidParticipants.length === others.length;
  const displayParticipants = tab === "unpaid" ? unpaidParticipants : tab === "pending" ? pendingParticipants : paidParticipants;
  // Full list for display (includes You in appropriate tab)
  const fullUnpaid = bill.participants.filter((p) => !p.paid && p.status !== "pending");
  const fullPending = bill.participants.filter((p) => !p.paid && p.status === "pending");
  const fullPaid = bill.participants.filter((p) => p.paid || p.status === "paid");
  const displayList = tab === "unpaid" ? fullUnpaid : tab === "pending" ? fullPending : fullPaid;

  return (
    <div className="min-h-screen pb-24">
      <TopBar showBack onBack={() => router.push("/app")} />

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
                <span className="text-lg text-on-surface-variant font-medium"> / RM{othersTotal.toFixed(0)}</span>
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
              <span>{paidParticipants.length} of {others.length} Paid</span>
            </div>
          </div>
        </section>

        {/* Payment QR */}
        <section className="bg-surface-container-lowest rounded-xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)]">
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Payment QR</h3>
          {adminQr ? (
            <div className="flex items-center gap-4">
              <img src={adminQr} alt="QR" className="w-16 h-16 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="text-xs text-on-surface">QR uploaded</p>
                <button
                  onClick={() => { setAdminQr(null); }}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  Replace
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => qrFileRef.current?.click()}
              disabled={qrUploading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary transition-colors"
            >
              {qrUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><Upload className="w-4 h-4" /><span className="text-sm font-semibold">Upload QR Code</span></>
              )}
            </button>
          )}
          <input ref={qrFileRef} type="file" accept="image/*" onChange={handleQrUpload} className="absolute opacity-0 w-0 h-0 pointer-events-none" />
        </section>

        {/* Tabs & Lists */}
        <section className="flex flex-col gap-4">
          <div className="flex gap-4 border-b border-outline-variant pb-2">
            <button
              onClick={() => setTab("unpaid")}
              className={`text-sm font-semibold pb-1 px-2 transition-colors ${tab === "unpaid" ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              Unpaid ({fullUnpaid.length})
            </button>
            <button
              onClick={() => setTab("pending")}
              className={`text-sm font-semibold pb-1 px-2 transition-colors ${tab === "pending" ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              Pending ({fullPending.length})
            </button>
            <button
              onClick={() => setTab("paid")}
              className={`text-sm font-semibold pb-1 px-2 transition-colors ${tab === "paid" ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              Paid ({fullPaid.length})
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
                  <div className="bg-surface-container-lowest rounded-xl p-3 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden text-on-surface-variant font-bold text-lg">
                          {contactAvatars[p.name] ? (
                            <img src={contactAvatars[p.name]} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            p.name[0].toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-on-surface">{p.name}</span>
                          <span className={`text-sm ${p.paid || p.status === "pending" ? "text-on-surface-variant" : "text-error font-semibold"}`}>
                            RM{p.amount.toFixed(2)}
                            {p.status === "pending" && <span className="text-amber-600 dark:text-amber-400 text-[10px] ml-1">• Pending</span>}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyParticipantLink(p)}
                          className="p-2 text-on-surface-variant/60 hover:text-primary transition-colors"
                          title="Copy payment link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {!p.paid && p.status !== "pending" && p.name !== "You" && (
                          <button
                            onClick={() => nudgeParticipant(p)}
                            className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-xs font-semibold hover:opacity-90 transition-opacity active:scale-95"
                          >
                            Nudge
                          </button>
                        )}
                        {(p.paid || p.status === "paid") && (
                          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-success-container/20 text-success text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> Paid
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Proof image + approve for pending */}
                    {p.status === "pending" && (
                      <div className="flex items-center gap-3 pt-1 border-t border-outline-variant">
                        {p.proof_image && (
                          <img src={p.proof_image} alt="Proof" className="w-12 h-12 rounded-lg object-cover" />
                        )}
                        <div className="flex gap-2 flex-1">
                          <button
                            onClick={() => approveParticipant(p)}
                            disabled={approving === p.id}
                            className="flex-1 py-1.5 rounded-lg bg-success text-white text-xs font-semibold flex items-center justify-center gap-1"
                          >
                            {approving === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle2 className="w-3 h-3" /> Approve</>}
                          </button>
                          <button
                            onClick={() => rejectParticipant(p)}
                            disabled={approving === p.id}
                            className="py-1.5 px-3 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold"
                          >
                            Reject
                          </button>
                        </div>
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

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-outline-variant px-4 py-3 flex justify-center">
        <button
          onClick={() => router.push("/app")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Bills
        </button>
      </nav>
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
