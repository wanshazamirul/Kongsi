"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

interface Participant {
  name: string;
  amount: string;
}

export default function CreateBillPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([
    { name: "", amount: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addParticipant() {
    setParticipants([...participants, { name: "", amount: "" }]);
  }

  function removeParticipant(index: number) {
    if (participants.length <= 1) return;
    setParticipants(participants.filter((_, i) => i !== index));
  }

  function updateParticipant(
    index: number,
    field: keyof Participant,
    value: string
  ) {
    const next = [...participants];
    next[index] = { ...next[index], [field]: value };
    setParticipants(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = participants.map((p) => ({
      name: p.name.trim(),
      amount: parseFloat(p.amount),
    }));

    const invalid = parsed.find(
      (p) => !p.name || isNaN(p.amount) || p.amount <= 0
    );
    if (invalid) {
      setError("Each participant needs a name and valid amount.");
      return;
    }

    if (!title.trim()) {
      setError("Give your bill a title.");
      return;
    }

    setSubmitting(true);
    const total = parsed.reduce((sum, p) => sum + p.amount, 0);

    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        total_amount: Math.round(total * 100) / 100,
        description: description.trim(),
        due_date: dueDate || undefined,
        participants: parsed.map((p) => ({
          name: p.name,
          amount: Math.round(p.amount * 100) / 100,
        })),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      // Save to local history
      try {
        const stored = localStorage.getItem("kongsi_bills");
        const bills = stored ? JSON.parse(stored) : [];
        bills.unshift({ id: data.id, title: title.trim(), total_amount: Math.round(total * 100) / 100, created: new Date().toISOString(), admin_token: data.admin_token });
        localStorage.setItem("kongsi_bills", JSON.stringify(bills.slice(0, 20)));
      } catch {}
      router.push(
        `/b/${data.id}/dashboard?token=${data.admin_token}&created=true`
      );
    } else {
      const err = await res.json();
      setError(err.error || "Something went wrong");
      setSubmitting(false);
    }
  }

  const total = participants.reduce(
    (sum, p) => sum + (parseFloat(p.amount) || 0),
    0
  );

  return (
    <div className="min-h-screen max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/")}
          className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Create Bill</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Bill details */}
        <Card className="p-4 space-y-4">
          <div>
            <Label htmlFor="title">Bill Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mamak dinner, Badminton court, Trip to Melaka..."
              className="mt-1"
              maxLength={200}
            />
          </div>
          <div>
            <Label htmlFor="desc">Description (optional)</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this for?"
              className="mt-1"
              rows={2}
              maxLength={500}
            />
          </div>
          <div>
            <Label htmlFor="due">Due Date (optional)</Label>
            <Input
              id="due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1"
            />
          </div>
        </Card>

        {/* Receipt Scanner placeholder */}
        <button
          type="button"
          className="w-full rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-3 flex items-center justify-center gap-2 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
        >
          <Camera className="w-4 h-4" />
          Scan Receipt (coming soon)
        </button>

        {/* Participants */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Participants</Label>
            <button
              type="button"
              onClick={addParticipant}
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          {participants.map((p, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  value={p.name}
                  onChange={(e) => updateParticipant(i, "name", e.target.value)}
                  placeholder="Name"
                  className="h-10"
                  maxLength={100}
                />
              </div>
              <div className="w-28">
                <Input
                  value={p.amount}
                  onChange={(e) =>
                    updateParticipant(i, "amount", e.target.value)
                  }
                  placeholder="RM"
                  type="number"
                  step="0.01"
                  min="0"
                  className="h-10"
                />
              </div>
              <button
                type="button"
                onClick={() => removeParticipant(i)}
                className="p-2.5 text-muted-foreground hover:text-red-400 transition-colors"
                disabled={participants.length <= 1}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {participants.length > 1 && (
            <p className="text-xs text-muted-foreground text-right">
              Total:{" "}
              <span className="font-semibold text-foreground">
                RM{total.toFixed(2)}
              </span>
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Create Bill & Get Links"
          )}
        </Button>
      </form>
    </div>
  );
}
