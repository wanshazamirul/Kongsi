"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Copy, Loader2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatRM } from "@/lib/utils";

export default function QRPage() {
  const { id } = useParams<{ id: string }>();
  const [bill, setBill] = useState<{ title: string; total_amount: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadBill(); }, [id]);

  async function loadBill() {
    const res = await fetch(`/api/bills/${id}`);
    if (res.ok) setBill(await res.json());
    setLoading(false);
  }

  function copyPaymentLink() {
    const url = `${window.location.origin}/b/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Payment link copied!");
  }

  function downloadQR() {
    // Use a QR API to generate an actual QR code
    const url = `${window.location.origin}/b/${id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
    window.open(qrUrl, "_blank");
    toast.success("QR code opened in new tab");
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!bill) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <Receipt className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">Bill not found</p>
      </div>
    );
  }

  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/b/${id}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 bg-surface">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface shadow-sm h-16 px-5 flex justify-between items-center">
        <a href="/app" className="p-2 -ml-2 rounded-full hover:bg-surface-container-low transition-colors">
          <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
        </a>
        <span className="text-lg font-bold text-primary">Kongsi</span>
        <div className="w-10" />
      </header>

      <main className="w-full max-w-md mx-auto pt-24 pb-8 flex flex-col items-center flex-grow justify-center">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-on-surface mb-2">Scan to Pay</h1>
          <p className="text-on-surface-variant">{bill.title}</p>
        </div>

        {/* QR Code */}
        <div className="relative bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_10px_30px_rgba(15,23,42,0.1)] mb-8 w-full max-w-[320px] aspect-square flex items-center justify-center mx-auto border border-outline-variant">
          <img
            src={qrSrc}
            alt="Payment QR Code"
            className="w-full h-full object-contain rounded-xl"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-primary rounded-full p-2 shadow-sm flex items-center justify-center w-12 h-12 border-4 border-surface-container-lowest">
              <Receipt className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="text-center mb-8">
          <span className="text-5xl font-bold text-on-surface tracking-tight">
            RM{bill.total_amount.toFixed(2)}
          </span>
        </div>

        {/* Actions */}
        <div className="w-full space-y-3">
          <Button
            onClick={downloadQR}
            className="w-full bg-primary text-primary-foreground rounded-full py-4 text-sm font-semibold flex items-center justify-center gap-2 shadow-[0px_4px_14px_rgba(70,72,212,0.3)] hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Download className="w-4 h-4" />
            Download QR
          </Button>
          <Button
            onClick={copyPaymentLink}
            variant="outline"
            className="w-full rounded-full py-4 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy Payment Link
          </Button>
        </div>
      </main>
    </div>
  );
}
