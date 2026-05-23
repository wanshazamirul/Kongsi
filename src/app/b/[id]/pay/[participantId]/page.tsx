"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2, Receipt, Upload, Check, ArrowUpToLine } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { toast } from "sonner";
import { convertToWebP } from "@/lib/image-utils";

interface ParticipantData {
  id: string;
  name: string;
  amount: number;
  paid: boolean;
  payment_token: string;
  proof_image: string | null;
  status: string;
}

interface BillData {
  id: string;
  title: string;
  total_amount: number;
  admin_qr: string | null;
  participant: ParticipantData | null;
}

function PayPageContent() {
  const { id, participantId } = useParams<{ id: string; participantId: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [bill, setBill] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [proof, setProof] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (token) loadBill();
  }, [id, participantId, token]);

  async function loadBill() {
    const res = await fetch(`/api/bills/${id}/pay/${participantId}?token=${token}`);
    if (res.ok) {
      const data = await res.json();
      setBill(data);
      if (data.participant?.proof_image) setProof(data.participant.proof_image);
      if (data.participant?.status === "pending" || data.participant?.status === "paid") {
        setSubmitted(true);
      }
    }
    setLoading(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const webp = await convertToWebP(file);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setProof(base64);
        const res = await fetch(`/api/bills/${id}/proof`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participant_id: participantId,
            token: token,
            proof_image: base64,
          }),
        });
        if (res.ok) {
          setSubmitted(true);
          toast.success("Proof uploaded! Pending admin approval.");
        } else {
          const err = await res.json();
          toast.error(err.error || "Upload failed");
        }
      };
      reader.readAsDataURL(webp);
    } catch {
      toast.error("Failed to process image");
    }
    setUploading(false);
    e.target.value = "";
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!bill || !bill.participant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <Receipt className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">Invalid link</p>
        <p className="text-xs text-muted-foreground">This payment link is broken or expired.</p>
      </div>
    );
  }

  const p = bill.participant;

  if (submitted && p.status === "paid") {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <TopBar />
        <main className="flex-1 flex flex-col items-center justify-center gap-6 px-5 text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
            <Check className="w-10 h-10 text-success" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-on-surface mb-2">Settled!</h1>
            <p className="text-sm text-on-surface-variant max-w-xs">
              Your payment for <strong>{bill.title}</strong> has been approved.
            </p>
            <p className="text-lg font-semibold text-success mt-4">
              Moga dimurahkan rezeki! ✨
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <TopBar />
        <main className="flex-1 flex flex-col items-center justify-center gap-6 px-5 text-center">
          <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
            <Upload className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-on-surface mb-2">Proof Submitted!</h1>
            <p className="text-sm text-on-surface-variant max-w-xs">
              Your payment proof for <strong>{bill.title}</strong> is pending admin approval.
            </p>
            <p className="text-sm text-on-surface-variant mt-4">Thank you! 🙏</p>
          </div>
          {proof && (
            <img src={proof} alt="Proof" className="max-w-xs rounded-xl shadow-md" />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <TopBar />

      <main className="flex-1 flex flex-col items-center px-5 pt-4 pb-8 max-w-md mx-auto w-full gap-6">
        {/* Bill info */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-on-surface">{bill.title}</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {p.name}, your share is
          </p>
          <p className="text-4xl font-bold text-primary mt-2">RM{p.amount.toFixed(2)}</p>
        </div>

        {/* QR Code */}
        {bill.admin_qr ? (
          <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant w-full text-center">
            <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
              Scan to Pay
            </h2>
            <img
              src={bill.admin_qr}
              alt="Payment QR"
              className="max-w-[240px] mx-auto rounded-lg"
            />
            <p className="text-[10px] text-on-surface-variant mt-2">
              Screenshot this QR and scan with your bank app
            </p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-xl p-6 border border-dashed border-outline-variant w-full text-center">
            <Receipt className="w-8 h-8 text-on-surface-variant/40 mx-auto mb-2" />
            <p className="text-xs text-on-surface-variant">
              Waiting for organizer to add payment QR
            </p>
          </div>
        )}

        {/* Upload Proof */}
        <div className="w-full space-y-3">
          <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Upload Payment Proof
          </h2>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary transition-colors active:scale-[0.99]"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <ArrowUpToLine className="w-5 h-5" />
                <span className="text-sm font-semibold">Upload Screenshot</span>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="absolute opacity-0 w-0 h-0 pointer-events-none"
          />
        </div>
      </main>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <PayPageContent />
    </Suspense>
  );
}
