"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Loader2, Receipt, X, Check, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { base64ToWebP } from "@/lib/image-utils";
import { TopBar } from "@/components/top-bar";

const FEE_KEYWORDS = ["tax", "service charge", "sst", "service tax", "gov tax", "gst", "sc", "svc", "fee", "gratuity", "tip"];

function isFeeItem(name: string): boolean {
  const lower = name.toLowerCase().trim();
  return FEE_KEYWORDS.some((k) => lower.includes(k) || lower === k);
}

interface ScannedItem {
  name: string;
  amount: number;
}

interface Participant {
  name: string;
  avatar?: string;
}

function ScanPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openCamera = searchParams.get("mode") === "camera";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState<Participant[]>(() => {
    try {
      const contacts: { name: string; avatar?: string }[] = JSON.parse(localStorage.getItem("kongsi_contacts") || "[]");
      return [{ name: "You" }, ...contacts.slice(0, 5).map((c) => ({ name: c.name, avatar: c.avatar }))];
    } catch { return [{ name: "You" }]; }
  });
  const [itemAssignments, setItemAssignments] = useState<Record<number, number>>({});
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("kongsi_scan_image");
    if (stored) {
      sessionStorage.removeItem("kongsi_scan_image");
      setImage(stored);
      scanReceipt(stored);
    } else if (openCamera) {
      setTimeout(() => cameraInputRef.current?.click(), 300);
    }
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>, fromCamera: boolean) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const raw = reader.result as string;
      const webp = await base64ToWebP(raw);
      setImage(webp);
      scanReceipt(webp);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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
    // Initialize all participants to 0
    validParticipants.forEach((_, pi) => { personTotals[pi] = 0; });

    items.forEach((item, itemIndex) => {
      const assignedTo = itemAssignments[itemIndex];
      if (assignedTo !== undefined) {
        personTotals[assignedTo] = (personTotals[assignedTo] || 0) + item.amount;
      } else {
        // Unassigned items split equally
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

  // Scanning progress — full screen
  if (scanning) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-surface px-5">
        <div className="w-24 h-24 rounded-3xl bg-primary/5 flex items-center justify-center animate-pulse">
          <Receipt className="w-12 h-12 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-on-surface mb-2">Scanning receipt...</h2>
          <p className="text-sm text-on-surface-variant">AI is reading your receipt. This takes a few seconds.</p>
        </div>
        <div className="w-48 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-[scan_2s_ease-in-out_infinite]" style={{ width: "60%" }} />
        </div>
        <style>{`
          @keyframes scan {
            0%, 100% { width: 10%; margin-left: 0%; }
            50% { width: 60%; margin-left: 40%; }
          }
        `}</style>
      </div>
    );
  }

  // Choose input screen
  if (!image) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <TopBar title="Upload Receipt" showBack onBack={() => router.push("/app")} />

        <main className="flex-1 flex flex-col items-center justify-center gap-6 px-5 pb-24">
          <div className="w-24 h-24 rounded-3xl bg-primary/5 flex items-center justify-center mb-2">
            <Receipt className="w-12 h-12 text-primary/60" />
          </div>
          <h2 className="text-xl font-bold text-on-surface">Add a receipt</h2>
              <p className="text-sm text-on-surface-variant text-center max-w-xs">
                Take a photo or upload from your gallery. AI will read the items automatically.
              </p>
              <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-[0px_4px_12px_rgba(70,72,212,0.3)]"
                >
                  <Camera className="w-5 h-5" />
                  Take Photo
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full h-12 rounded-xl border-outline-variant text-on-surface font-semibold flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-5 h-5" />
                  Upload from Gallery
                </Button>
                <div className="text-center mt-2">
                  <button onClick={() => router.push("/app/create")} className="text-xs text-primary font-semibold hover:underline">
                    Enter manually instead
                  </button>
                </div>
              </div>
        </main>

        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => handleFile(e, true)} className="absolute opacity-0 w-0 h-0 pointer-events-none" />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleFile(e, false)} className="absolute opacity-0 w-0 h-0 pointer-events-none" />
      </div>
    );
  }

  // Split Items view
  return (
    <div className="text-on-surface antialiased pb-32">
      <TopBar title="Split Items" showBack onBack={() => { setImage(null); setItems([]); }} />

      <main className="px-5 flex flex-col gap-6">
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

        <section className="flex gap-3 overflow-x-auto pb-1">
          {validParticipants.map((p, i) => (
            <div key={i} className="flex flex-col items-center gap-1 shrink-0">
              <div className={`w-10 h-10 rounded-full border-2 p-0.5 overflow-hidden ${i === 0 ? "border-primary" : "border-outline-variant"}`}>
                {p.avatar ? (
                  <img src={p.avatar} alt={p.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-surface-container-high flex items-center justify-center text-sm font-bold text-on-surface-variant">
                    {p.name[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-semibold text-on-surface">{p.name}</span>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">TAP AVATARS TO ASSIGN</h3>
          {items.map((item, i) => {
            const isFee = isFeeItem(item.name);
            return (
            <div key={i} className={`bg-surface-container-lowest rounded-xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border ${isFee ? "border-success/20 bg-success-container/5" : "border-outline-variant"}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-on-surface">{item.name}</h4>
                  {isFee && <p className="text-[10px] text-success font-medium mt-0.5">Auto-split equally</p>}
                </div>
                <span className="text-sm font-semibold text-on-surface">RM{item.amount.toFixed(2)}</span>
              </div>
              {!isFee && (
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
              )}
            </div>
            );
          })}
        </section>

        <div>
          <Label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">Bill Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-surface-container-lowest border-outline-variant rounded-xl" />
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

      <div className="fixed bottom-16 left-0 w-full bg-surface-container-lowest shadow-[0px_-10px_30px_rgba(15,23,42,0.1)] rounded-t-xl px-5 py-4 z-50">
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
        <Button onClick={createBill} disabled={creating} className="w-full bg-primary text-primary-foreground h-12 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Confirm Splitting</span><span>→</span></>}
        </Button>
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}>
      <ScanPageContent />
    </Suspense>
  );
}
