"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Loader2, Camera, Search, UserPlus, QrCode, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface Participant {
  name: string;
  amount: string;
}

interface SavedContact {
  name: string;
}

const STEPS = ["Bill Details", "Participants", "Review"];

export default function CreateBillPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 1: Bill details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Step 2: Participants
  const [participants, setParticipants] = useState<Participant[]>([
    { name: "You", amount: "" },
    { name: "", amount: "" },
  ]);
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentContacts] = useState<SavedContact[]>(() => {
    try {
      const stored = localStorage.getItem("kongsi_contacts");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Step 3: Review
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addParticipant() {
    setParticipants([...participants, { name: "", amount: "" }]);
  }

  function removeParticipant(index: number) {
    if (index === 0) return; // Can't remove "You"
    setParticipants(participants.filter((_, i) => i !== index));
  }

  function updateParticipant(index: number, field: keyof Participant, value: string) {
    const next = [...participants];
    next[index] = { ...next[index], [field]: value };
    setParticipants(next);
  }

  function addContact(contact: SavedContact) {
    if (participants.some((p) => p.name === contact.name)) return;
    setParticipants([...participants, { name: contact.name, amount: "" }]);
  }

  function canProceed(): boolean {
    if (step === 0) return title.trim().length > 0;
    if (step === 1) {
      const valid = participants.filter((p) => p.name.trim());
      return valid.length >= 2;
    }
    return true;
  }

  async function handleSubmit() {
    setError(null);
    const parsed = participants
      .filter((p) => p.name.trim())
      .map((p) => ({
        name: p.name.trim(),
        amount: parseFloat(p.amount) || 0,
      }));

    const invalid = parsed.find((p) => !p.name || isNaN(p.amount) || p.amount < 0);
    if (invalid) {
      setError("Each participant needs a name and valid amount.");
      return;
    }

    const total = parsed.reduce((sum, p) => sum + p.amount, 0);
    if (total <= 0) {
      setError("Total amount must be greater than zero.");
      return;
    }

    setSubmitting(true);

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
        // Save contacts
        const contacts = new Set(recentContacts.map((c) => c.name));
        parsed.forEach((p) => { if (p.name !== "You") contacts.add(p.name); });
        localStorage.setItem("kongsi_contacts", JSON.stringify(Array.from(contacts).map((n) => ({ name: n }))));
      } catch {}
      router.push(`/b/${data.id}/dashboard?token=${data.admin_token}&created=true`);
    } else {
      const err = await res.json();
      setError(err.error || "Something went wrong");
    }
    setSubmitting(false);
  }

  const total = participants.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const validCount = participants.filter((p) => p.name.trim()).length;

  const filteredContacts = recentContacts.filter(
    (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !participants.some((p) => p.name === c.name)
  );

  return (
    <div className="min-h-screen max-w-lg mx-auto px-5 py-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => (step === 0 ? router.push("/app") : setStep(step - 1))} className="p-2 -ml-2 rounded-full hover:bg-surface-container-low transition-colors">
          <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
        </button>
        <div className="font-semibold text-primary">Kongsi</div>
        <button onClick={() => router.push("/app")} className="p-2 -mr-2 rounded-full hover:bg-surface-container-low transition-colors">
          <span className="text-on-surface-variant text-lg">✕</span>
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="text-xs font-semibold text-primary">{STEPS[step]}</span>
        </div>
        <div className="h-2 bg-surface-container-high rounded-full overflow-hidden flex">
          <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      {/* Step 0: Bill Details */}
      {step === 0 && (
        <div className="flex-1 flex flex-col">
          <h1 className="text-[28px] leading-[36px] font-bold text-on-surface mb-1">Create new bill</h1>
          <p className="text-on-surface-variant mb-8">Enter the basic details to start splitting.</p>

          <div className="space-y-6">
            <div>
              <Label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">Total Amount</Label>
              <div className="relative flex items-center bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0px_4px_20px_rgba(15,23,42,0.05)] focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-2xl font-bold text-on-surface-variant">RM</span>
                </div>
                <Input
                  className="block w-full pl-[60px] pr-4 py-5 bg-transparent border-none text-[28px] font-bold text-on-surface focus:ring-0 placeholder:text-outline-variant rounded-xl"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0"
                  value={total || ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    if (participants.length >= 2 && splitMode === "equal") {
                      const perPerson = val / participants.filter((p) => p.name.trim()).length || 1;
                      const next = participants.map((p) => (p.name.trim() ? { ...p, amount: perPerson.toFixed(2) } : p));
                      setParticipants(next);
                    }
                  }}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">Bill Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Dinner at Amore"
                className="bg-surface-container-lowest border-outline-variant rounded-xl text-lg py-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)]"
                maxLength={200}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add some context..."
                className="bg-surface-container-lowest border-outline-variant rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] resize-none"
                rows={3}
                maxLength={500}
              />
            </div>
          </div>

          <div className="flex-1" />
          <div className="pt-6 pb-safe">
            <Button
              onClick={() => setStep(1)}
              disabled={!canProceed()}
              className="w-full h-12 bg-primary text-primary-foreground rounded-xl text-lg font-semibold shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] hover:-translate-y-[1px] active:translate-y-[1px] transition-all flex items-center justify-center gap-2"
            >
              Next
              <span className="text-xl">→</span>
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: Participants */}
      {step === 1 && (
        <div className="flex-1 flex flex-col">
          <h1 className="text-[28px] leading-[36px] font-bold text-on-surface mb-1">Add Participants</h1>
          <p className="text-on-surface-variant mb-6">Who's splitting this bill with you?</p>

          {/* Search */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-outline" />
            </div>
            <Input
              className="pl-12 pr-4 py-3 bg-surface-container-lowest border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-on-surface placeholder:text-on-surface-variant shadow-[0px_4px_20px_rgba(15,23,42,0.05)]"
              placeholder="Search by name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Quick Add contacts */}
          {filteredContacts.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Quick Add</h2>
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5">
                {filteredContacts.slice(0, 8).map((contact) => (
                  <button
                    key={contact.name}
                    onClick={() => addContact(contact)}
                    className="flex flex-col items-center gap-2 group flex-shrink-0"
                  >
                    <div className="w-14 h-14 rounded-full bg-surface-container-high border-2 border-transparent group-hover:border-primary transition-colors flex items-center justify-center text-lg font-bold text-on-surface-variant">
                      {contact.name[0]}
                    </div>
                    <span className="text-sm text-on-surface">{contact.name}</span>
                  </button>
                ))}
                <button
                  onClick={addParticipant}
                  className="flex flex-col items-center gap-2 group flex-shrink-0"
                >
                  <div className="w-14 h-14 rounded-full bg-surface-container-high border-2 border-transparent group-hover:border-primary transition-colors flex items-center justify-center text-outline">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <span className="text-sm text-on-surface">New</span>
                </button>
              </div>
            </div>
          )}

          {/* Selected Participants */}
          <div className="flex-1">
            <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
              Selected ({validCount})
            </h2>
            <div className="space-y-2">
              {participants.map((p, i) => (
                <Card key={i} className="p-3 flex items-center justify-between bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-semibold text-sm">
                      {p.name ? p.name[0].toUpperCase() : "?"}
                    </div>
                    {i === 0 ? (
                      <span className="text-on-surface font-semibold">You</span>
                    ) : (
                      <Input
                        value={p.name}
                        onChange={(e) => updateParticipant(i, "name", e.target.value)}
                        placeholder="Name"
                        className="border-0 bg-transparent focus:ring-0 p-0 h-auto text-on-surface font-semibold"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {splitMode === "custom" && (
                      <Input
                        value={p.amount}
                        onChange={(e) => updateParticipant(i, "amount", e.target.value)}
                        placeholder="RM"
                        type="number"
                        step="0.01"
                        className="w-24 h-9 text-sm"
                      />
                    )}
                    {i !== 0 && (
                      <button onClick={() => removeParticipant(i)} className="p-1.5 text-on-surface-variant hover:text-error rounded-full hover:bg-error-container/20 transition-colors">
                        <span className="text-lg">✕</span>
                      </button>
                    )}
                  </div>
                </Card>
              ))}
              <button
                onClick={addParticipant}
                className="w-full p-3 border border-dashed border-outline-variant rounded-xl text-on-surface-variant hover:text-on-surface hover:border-outline transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add person
              </button>
            </div>
          </div>

          {/* Split method */}
          <div className="mb-4">
            <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Split Method</h2>
            <div className="flex bg-surface-container-low p-1 rounded-xl">
              <button
                onClick={() => setSplitMode("equal")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${splitMode === "equal" ? "bg-surface-container-lowest shadow-[0px_2px_8px_rgba(15,23,42,0.05)] text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
              >
                Split Equally
              </button>
              <button
                onClick={() => setSplitMode("custom")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${splitMode === "custom" ? "bg-surface-container-lowest shadow-[0px_2px_8px_rgba(15,23,42,0.05)] text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
              >
                Custom Amounts
              </button>
            </div>
          </div>

          <div className="pt-4 pb-safe">
            <Button
              onClick={() => {
                // Auto-calculate equal split
                if (splitMode === "equal" && total > 0 && validCount >= 2) {
                  const perPerson = Math.round((total / validCount) * 100) / 100;
                  const next = participants.map((p) => (p.name.trim() ? { ...p, amount: perPerson.toFixed(2) } : p));
                  setParticipants(next);
                }
                setStep(2);
              }}
              disabled={!canProceed()}
              className="w-full h-12 bg-primary text-primary-foreground rounded-xl text-lg font-semibold shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] hover:-translate-y-[1px] active:translate-y-[1px] transition-all flex items-center justify-center gap-2"
            >
              Next Step
              <span className="text-xl">→</span>
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <div className="flex-1 flex flex-col">
          <h1 className="text-[28px] leading-[36px] font-bold text-on-surface mb-1">Review & Create</h1>
          <p className="text-on-surface-variant mb-6">Double-check before sharing.</p>

          <Card className="p-4 bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] mb-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Bill</span>
                <span className="font-semibold text-on-surface">{title}</span>
              </div>
              {description && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Description</span>
                  <span className="text-on-surface text-sm text-right max-w-[60%]">{description}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Total</span>
                <span className="font-bold text-lg text-primary">RM{total.toFixed(2)}</span>
              </div>
              {validCount >= 2 && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Per person</span>
                  <span className="font-semibold text-on-surface">RM{(total / validCount).toFixed(2)}</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4 bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)]">
            <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Participants</h3>
            <div className="space-y-2">
              {participants.filter((p) => p.name.trim()).map((p, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold">
                      {p.name[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-on-surface">{p.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-on-surface">
                    {p.amount ? `RM${parseFloat(p.amount).toFixed(2)}` : `RM${(total / validCount || 0).toFixed(2)}`}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {error && (
            <p className="text-sm text-error bg-error-container/20 rounded-lg p-3 mt-4">{error}</p>
          )}

          <div className="flex-1" />
          <div className="pt-6 pb-safe space-y-3">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full h-12 bg-primary text-primary-foreground rounded-xl text-lg font-semibold shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] hover:-translate-y-[1px] active:translate-y-[1px] transition-all"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Bill & Share"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setStep(1)}
              className="w-full h-10 text-on-surface-variant"
            >
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
