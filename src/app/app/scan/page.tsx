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

type Step = "capture" | "review" | "assign" | "create";

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanStep, setScanStep] = useState<Step>("capture");
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
    setScanStep("review");
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

  function updateItem(index: number, field: keyof ScannedItem, value: string | number) {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    setItems(next);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function toggleItemAssignment(itemIndex: number, participantIndex: number) {
    setItemAssignments((prev) => {
      const next = { ...prev };
      if (next[itemIndex] === participantIndex) {
        delete next[itemIndex];
      } else {
        next[itemIndex] = participantIndex;
      }
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

    // Calculate per-person amounts based on item assignments
    const personTotals: Record<number, number> = {};
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

  return (
    <div className="max-w-lg mx-auto px-5 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push("/app")} className="p-2 -ml-2 rounded-full hover:bg-surface-container-low">
          <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
        </button>
        <span className="font-semibold text-primary">Kongsi</span>
        <div className="w-10" />
      </div>

      {!image ? (
        /* Capture */
        <div className="space-y-4 pt-8">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors p-12 flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium text-primary">Tap to scan receipt</p>
              <p className="text-xs text-on-surface-variant mt-1">Take a photo of your bill or receipt</p>
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />

          <div className="text-center">
            <span className="text-xs text-on-surface-variant">or</span>
          </div>

          <Button variant="outline" className="w-full rounded-xl border-outline-variant" onClick={() => router.push("/app/create")}>
            <Receipt className="w-4 h-4 mr-2" />
            Enter manually
          </Button>
        </div>
      ) : scanning ? (
        <div className="flex items-center justify-center gap-3 py-16 text-on-surface-variant">
          <Loader2 className="w-6 h-6 animate-spin" />
          Reading receipt...
        </div>
      ) : (
        /* Review + Assign + Create */
        <div className="space-y-5">
          {/* Image preview */}
          <div className="relative rounded-xl overflow-hidden border border-outline-variant">
            <img src={image} alt="Receipt" className="w-full h-40 object-cover" />
            <button onClick={() => { setImage(null); setItems([]); setScanStep("capture"); }} className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Items with assignment */}
          <div>
            <Label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3 block">Items — Tap avatars to assign</Label>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-xl p-3 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-outline-variant">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{item.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-on-surface">RM{item.amount.toFixed(2)}</span>
                      <button onClick={() => removeItem(i)} className="p-1 text-on-surface-variant hover:text-error">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Avatar assignment row */}
                  <div className="flex gap-2 mt-2">
                    {validParticipants.map((p, pi) => (
                      <button
                        key={pi}
                        onClick={() => toggleItemAssignment(i, pi)}
                        className={`w-10 h-10 rounded-full relative active:scale-95 transition-all ${
                          itemAssignments[i] === pi
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest"
                            : "opacity-50 grayscale hover:opacity-80 hover:grayscale-0"
                        }`}
                      >
                        <div className="w-full h-full rounded-full bg-surface-container-high flex items-center justify-center text-sm font-bold text-on-surface-variant">
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
            </div>
            {items.length > 0 && (
              <p className="text-xs text-on-surface-variant text-right mt-2">
                Total: <span className="font-semibold text-primary">RM{total.toFixed(2)}</span>
              </p>
            )}
          </div>

          {/* Title & participants */}
          <div>
            <Label htmlFor="bill-title" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">Bill Title</Label>
            <Input
              id="bill-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Restaurant bill"
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
            {validParticipants.length > 1 && total > 0 && (
              <p className="text-xs text-on-surface-variant">
                Each pays: <span className="font-semibold">RM{(total / validParticipants.length).toFixed(2)}</span>
              </p>
            )}
          </div>

          <Button
            onClick={createBill}
            disabled={creating}
            className="w-full h-12 bg-primary text-primary-foreground rounded-xl text-lg font-semibold shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] hover:-translate-y-[1px] active:translate-y-[1px] transition-all"
          >
            {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create & Share Bill"}
          </Button>
        </div>
      )}
    </div>
  );
}
