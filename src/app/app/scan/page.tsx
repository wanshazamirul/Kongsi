"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, ArrowLeft, Receipt, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ScannedItem {
  name: string;
  amount: number;
}

interface Participant {
  name: string;
}

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([{ name: "You" }, { name: "" }]);
  const [itemAssignments, setItemAssignments] = useState<Record<number, number>>({});
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("kongsi_scan_image");
    if (stored) {
      sessionStorage.removeItem("kongsi_scan_image");
      setImage(stored);
      scanReceipt(stored);
    }
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImage(base64);
      scanReceipt(base64);
    };
    reader.readAsDataURL(file);
  }

  async function scanReceipt(base64: string) {
    setScanning(true);
    try {
      const res = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.items?.length > 0) {
          setItems(data.items);
          setTitle(data.title || "Restaurant Bill");
          toast.success(`Found ${data.items.length} items!`);
        } else {
          toast.error("Couldn't read the receipt. Try again or enter manually.");
        }
      } else {
        toast.error("Scan failed. Try again.");
      }
    } catch {
      toast.error("Scan failed. Check connection.");
    } finally {
      setScanning(false);
    }
  }

  function toggleItemAssignment(itemIndex: number, participantIndex: number) {
    setItemAssignments((prev) => {
      const next = { ...prev };
      if (next[itemIndex] === participantIndex) delete next[itemIndex];
      else next[itemIndex] = participantIndex;
      return next;
    });
  }

  function addParticipant() {
    setParticipants([...participants, { name: "" }]);
  }

  async function createBill() {
    if (!title.trim()) { toast.error("Give the bill a title"); return; }
    if (items.length === 0) { toast.error("No items to split"); return; }

    const validParticipants = participants.filter((p) => p.name.trim());
    if (validParticipants.length === 0) { toast.error("Add at least one person"); return; }

    setCreating(true);

    const personTotals: Record<number, number> = {};
    items.forEach((item, itemIndex) => {
      const assignedTo = itemAssignments[itemIndex];
      if (assignedTo !== undefined) {
        personTotals[assignedTo] = (personTotals[assignedTo] || 0) + item.amount;
      } else {
        const perPerson = item.amount / validParticipants.length;
        validParticipants.forEach((_, pi) => {
          personTotals[pi] = (personTotals[pi] || 0) + perPerson;
        });
      }
    });

    const total = items.reduce((s, i) => s + i.amount, 0);

    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        total_amount: Math.round(total * 100) / 100,
        description: items.map((i) => `${i.name} RM${i.amount.toFixed(2)}`).join(", "),
        participants: validParticipants.map((p, pi) => ({
          name: p.name.trim(),
          amount: Math.round((personTotals[pi] || total / validParticipants.length) * 100) / 100,
        })),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      try {
        const stored = localStorage.getItem("kongsi_bills");
        const bills = stored ? JSON.parse(stored) : [];
        bills.unshift({ id: data.id, title: title.trim(), total_amount: Math.round(total * 100) / 100, created: new Date().toISOString(), admin_token: data.admin_token });
        localStorage.setItem("kongsi_bills", JSON.stringify(bills.slice(0, 20)));
      } catch {}
      router.push(`/b/${data.id}/dashboard?token=${data.admin_token}&created=true`);
    } else {
      toast.error("Failed to create bill");
    }
    setCreating(false);
  }

  const total = items.reduce((s, i) => s + i.amount, 0);
  const validParticipants = participants.filter((p) => p.name.trim());

  // Camera viewfinder
  if (!image) {
    return (
      <div className="bg-black text-white h-screen w-full overflow-hidden antialiased">
        <main className="relative h-full w-full flex flex-col items-center justify-center">
          {/* Simulated camera feed */}
          <div className="absolute inset-0 w-full h-full bg-[#1a1a2e]" />

          {/* Top Actions */}
          <header className="absolute top-0 left-0 w-full flex justify-between items-center px-5 pt-12 pb-4 z-20">
            <button onClick={() => router.push("/app")} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full backdrop-blur-md text-white hover:bg-white/20 transition-colors active:scale-95">
              <span className="text-xl">✕</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full backdrop-blur-md text-white hover:bg-white/20 transition-colors active:scale-95">
              <span className="text-xl">⚡</span>
            </button>
          </header>

          {/* Viewfinder Reticle */}
          <div className="relative w-[85%] aspect-[1/1.6] max-h-[574px] flex flex-col items-center justify-center z-20">
            <div className="absolute inset-0 w-full h-full">
              {/* Glowing Corners */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-xl shadow-[0_0_20px_rgba(70,72,212,0.6)]" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-xl shadow-[0_0_20px_rgba(70,72,212,0.6)]" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-xl shadow-[0_0_20px_rgba(70,72,212,0.6)]" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-xl shadow-[0_0_20px_rgba(70,72,212,0.6)]" />
              {/* Animated Scan Line */}
              <div className="absolute left-0 w-full h-[2px] bg-primary shadow-[0_0_15px_rgba(70,72,212,1)] animate-scan z-30" />
              <div className="absolute inset-2 border border-white/10 rounded-lg" />
            </div>
            {/* Instruction */}
            <div className="absolute -bottom-16 w-full text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm text-white border border-white/10 shadow-lg">
                ⊕ Align receipt within the frame
              </span>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 w-full pb-10 pt-16 px-5 flex justify-between items-center z-20 bg-gradient-to-t from-black via-black/80 to-transparent">
            <button onClick={() => router.push("/app/create")} className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors group active:scale-95 w-20">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20">
                <span className="text-2xl">🖼</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider">Upload</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="relative w-20 h-20 rounded-full border-[3px] border-white flex items-center justify-center active:scale-90 transition-transform duration-200 group">
              <div className="absolute inset-1 bg-white rounded-full group-active:bg-surface-variant transition-colors duration-200" />
            </button>
            <button onClick={() => router.push("/app/create")} className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors group active:scale-95 w-20">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20">
                <span className="text-2xl">✏️</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider">Manual</span>
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
        </main>
        <style>{`
          @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
          .animate-scan {
            animation: scan 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            position: absolute;
          }
        `}</style>
      </div>
    );
  }

  // Split Items view
  return (
    <div className="text-on-surface antialiased pb-32">
      <header className="fixed top-0 w-full z-50 bg-surface shadow-sm h-16 px-5 flex justify-between items-center">
        <button onClick={() => { setImage(null); setItems([]); }} className="w-10 h-10 flex items-center justify-center text-primary active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-on-surface">Split Items</h1>
        <div className="w-10" />
      </header>

      <main className="pt-24 px-5 flex flex-col gap-6">
        {/* Receipt Header */}
        <section className="bg-surface-container-lowest rounded-xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-on-surface">{title || "Receipt"}</h2>
              <p className="text-xs text-on-surface-variant">Today</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold text-on-surface-variant uppercase mb-1">TOTAL</p>
            <p className="text-sm font-semibold text-primary">RM{total.toFixed(2)}</p>
          </div>
        </section>

        {/* Participants Legend */}
        <section className="flex gap-3 overflow-x-auto pb-1">
          {validParticipants.map((p, i) => (
            <div key={i} className="flex flex-col items-center gap-1 shrink-0">
              <div className={`w-10 h-10 rounded-full border-2 p-0.5 ${i === 0 ? "border-primary" : "border-outline-variant"}`}>
                <div className="w-full h-full rounded-full bg-surface-container-high flex items-center justify-center text-sm font-bold text-on-surface-variant">
                  {p.name[0]?.toUpperCase() || "?"}
                </div>
              </div>
              <span className="text-[10px] font-semibold text-on-surface">{p.name}</span>
            </div>
          ))}
        </section>

        {/* Itemized List */}
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">TAP AVATARS TO ASSIGN</h3>
          {items.map((item, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-outline-variant">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-on-surface">{item.name}</h4>
                </div>
                <span className="text-sm font-semibold text-on-surface">RM{item.amount.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                {validParticipants.map((p, pi) => (
                  <button
                    key={pi}
                    onClick={() => toggleItemAssignment(i, pi)}
                    className={`w-10 h-10 rounded-full relative active:scale-95 transition-all ${
                      itemAssignments[i] === pi
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest opacity-100"
                        : "opacity-50 grayscale hover:opacity-80 hover:grayscale-0"
                    }`}
                  >
                    <div className="w-full h-full rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-surface-variant">
                      {p.name[0]?.toUpperCase() || "?"}
                    </div>
                    {itemAssignments[i] === pi && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success text-on-success-container rounded-full flex items-center justify-center border-2 border-surface-container-lowest">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Title & Participants */}
        <div>
          <Label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">Bill Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-surface-container-lowest border-outline-variant rounded-xl"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Split between</Label>
            <button onClick={addParticipant} className="text-xs text-primary font-semibold hover:underline">+ Add</button>
          </div>
          {participants.map((p, i) => (
            <Input
              key={i}
              value={p.name}
              onChange={(e) => {
                const next = [...participants];
                next[i] = { name: e.target.value };
                setParticipants(next);
              }}
              placeholder={i === 0 ? "You" : `Person ${i + 1}`}
              className="bg-surface-container-lowest border-outline-variant rounded-xl"
              disabled={i === 0}
            />
          ))}
        </div>
      </main>

      {/* Contextual Footer */}
      <div className="fixed bottom-0 left-0 w-full bg-surface-container-lowest shadow-[0px_-10px_30px_rgba(15,23,42,0.1)] rounded-t-xl px-5 py-4 pb-8 z-50">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-[10px] font-semibold text-on-surface-variant uppercase">YOUR TOTAL</p>
            <p className="text-xl font-bold text-primary">
              RM{validParticipants.length > 0 ? (total / validParticipants.length).toFixed(2) : "0.00"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold text-on-surface-variant uppercase">LEFT TO ASSIGN</p>
            <p className="text-sm font-semibold text-success">RM0.00</p>
          </div>
        </div>
        <Button
          onClick={createBill}
          disabled={creating}
          className="w-full bg-primary text-primary-foreground h-12 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <>
              <span>Confirm Splitting</span>
              <span>→</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
