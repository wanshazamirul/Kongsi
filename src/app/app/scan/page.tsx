"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload, Loader2, ArrowLeft, Receipt, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ScannedItem {
  name: string;
  amount: number;
}

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState<{ name: string }[]>([{ name: "" }]);
  const [creating, setCreating] = useState(false);

  // Auto-load image from camera capture (bottom nav scan button)
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

  function addParticipant() {
    setParticipants([...participants, { name: "" }]);
  }

  async function createBill() {
    if (!title.trim()) { toast.error("Give the bill a title"); return; }
    if (items.length === 0) { toast.error("No items to split"); return; }

    const validParticipants = participants.filter((p) => p.name.trim());
    if (validParticipants.length === 0) { toast.error("Add at least one person"); return; }

    setCreating(true);
    const total = items.reduce((s, i) => s + i.amount, 0);
    const perPerson = Math.round((total / validParticipants.length) * 100) / 100;

    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        total_amount: Math.round(total * 100) / 100,
        description: items.map((i) => `${i.name} RM${i.amount.toFixed(2)}`).join(", "),
        participants: validParticipants.map((p) => ({ name: p.name.trim(), amount: perPerson })),
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

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/app")} className="p-2 -ml-2 rounded-lg hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Scan Receipt</h1>
      </div>

      {!image ? (
        /* Upload area */
        <div className="space-y-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-2xl border-2 border-dashed border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors p-12 flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Camera className="w-8 h-8 text-amber-400" />
            </div>
            <div className="text-center">
              <p className="font-medium text-amber-400">Tap to scan receipt</p>
              <p className="text-xs text-muted-foreground mt-1">Take a photo of your bill or receipt</p>
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />

          <div className="text-center">
            <span className="text-xs text-muted-foreground">or</span>
          </div>

          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => router.push("/app/create")}
          >
            <Receipt className="w-4 h-4 mr-2" />
            Enter manually
          </Button>
        </div>
      ) : (
        /* Result view */
        <div className="space-y-5">
          {/* Image preview */}
          <div className="relative rounded-xl overflow-hidden border border-border">
            <img src={image} alt="Receipt" className="w-full h-48 object-cover" />
            <button
              onClick={() => { setImage(null); setItems([]); }}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {scanning ? (
            <div className="flex items-center justify-center gap-3 py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              Reading receipt...
            </div>
          ) : (
            <>
              {/* Items */}
              <div className="space-y-2">
                <Label>Items</Label>
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(i, "name", e.target.value)}
                      className="flex-1 h-10"
                      placeholder="Item name"
                    />
                    <Input
                      value={item.amount || ""}
                      onChange={(e) => updateItem(i, "amount", parseFloat(e.target.value) || 0)}
                      type="number"
                      step="0.01"
                      className="w-24 h-10"
                      placeholder="RM"
                    />
                    <button onClick={() => removeItem(i)} className="p-2 text-muted-foreground hover:text-red-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {items.length > 0 && (
                  <p className="text-xs text-muted-foreground text-right">
                    Total: <span className="font-semibold text-amber-400">RM{total.toFixed(2)}</span>
                  </p>
                )}
              </div>

              {/* Title & participants */}
              <div>
                <Label htmlFor="bill-title">Bill Title</Label>
                <Input
                  id="bill-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Mamak dinner, Groceries..."
                  className="mt-1"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Split between</Label>
                  <button onClick={addParticipant} className="text-xs text-primary hover:underline">+ Add</button>
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
                    placeholder={`Person ${i + 1}`}
                    className="h-10"
                  />
                ))}
                {participants.length > 1 && total > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Each pays: <span className="font-semibold">RM{(total / participants.filter(p => p.name.trim()).length || 1).toFixed(2)}</span>
                  </p>
                )}
              </div>

              <Button
                onClick={createBill}
                disabled={creating}
                className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create & Share Bill"}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
