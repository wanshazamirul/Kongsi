"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search, UserPlus, Loader2, Check } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");

  const [participants, setParticipants] = useState<Participant[]>([
    { name: "You", amount: "" },
    { name: "", amount: "" },
  ]);
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentContacts] = useState<SavedContact[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("kongsi_contacts") || "[]");
    } catch { return []; }
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function canProceed(): boolean {
    if (step === 0) return title.trim().length > 0 && parseFloat(totalAmount) > 0;
    if (step === 1) return participants.filter((p) => p.name.trim()).length >= 2;
    return true;
  }

  function handleNext() {
    if (step === 0) {
      // Distribute amount equally by default
      const total = parseFloat(totalAmount) || 0;
      const valid = participants.filter((p) => p.name.trim());
      if (total > 0 && valid.length >= 2 && splitMode === "equal") {
        const pp = Math.round((total / valid.length) * 100) / 100;
        setParticipants(participants.map((p) => (p.name.trim() ? { ...p, amount: pp.toFixed(2) } : p)));
      }
      setStep(1);
    } else if (step === 1) {
      // Auto-calculate equal split if needed
      const total = parseFloat(totalAmount) || 0;
      const valid = participants.filter((p) => p.name.trim());
      if (splitMode === "equal" && total > 0 && valid.length >= 2) {
        const pp = Math.round((total / valid.length) * 100) / 100;
        setParticipants(participants.map((p) => (p.name.trim() ? { ...p, amount: pp.toFixed(2) } : p)));
      }
      setStep(2);
    }
  }

  async function handleSubmit() {
    setError(null);
    const total = parseFloat(totalAmount) || 0;

    const parsed = participants
      .filter((p) => p.name.trim())
      .map((p) => ({
        name: p.name.trim(),
        amount: parseFloat(p.amount) || (splitMode === "equal" ? total / participants.filter((pp) => pp.name.trim()).length : 0),
      }));

    const invalid = parsed.find((p) => !p.name || isNaN(p.amount) || p.amount < 0);
    if (invalid) { setError("Each participant needs a name and valid amount."); return; }
    if (total <= 0) { setError("Total amount must be greater than zero."); return; }

    setSubmitting(true);
    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        total_amount: Math.round(total * 100) / 100,
        description: description.trim(),
        participants: parsed.map((p) => ({ name: p.name, amount: Math.round(p.amount * 100) / 100 })),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      try {
        const stored = localStorage.getItem("kongsi_bills");
        const bills = stored ? JSON.parse(stored) : [];
        bills.unshift({ id: data.id, title: title.trim(), total_amount: Math.round(total * 100) / 100, created: new Date().toISOString(), admin_token: data.admin_token });
        localStorage.setItem("kongsi_bills", JSON.stringify(bills.slice(0, 20)));
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

  const total = parseFloat(totalAmount) || 0;
  const validCount = participants.filter((p) => p.name.trim()).length;
  const perPerson = validCount > 0 ? total / validCount : 0;
  const filteredContacts = recentContacts.filter(
    (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !participants.some((p) => p.name === c.name)
  );

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <TopBar showBack onBack={() => (step === 0 ? router.push("/app") : setStep(step - 1))} />

      <main className="flex-grow flex flex-col px-5 pt-16 pb-8 max-w-lg mx-auto w-full">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Step {step + 1} of {STEPS.length}</span>
            <span className="text-xs font-semibold text-primary">{STEPS[step]}</span>
          </div>
          <div className="h-2 bg-surface-container-high rounded-full overflow-hidden flex">
            <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>

        {/* STEP 1: Bill Details */}
        {step === 0 && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-on-surface mb-3 tracking-[-0.01em]">Create new bill</h1>
              <p className="text-sm text-on-surface-variant">Enter the basic details to start splitting.</p>
            </div>
            <div className="space-y-8">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2" htmlFor="amount">Total Amount</label>
                <div className="relative flex items-center bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0px_4px_20px_rgba(15,23,42,0.05)] focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-3xl font-bold text-on-surface-variant">RM</span>
                  </div>
                  <Input
                    id="amount"
                    className="block w-full pl-[72px] pr-4 py-5 bg-transparent border-none text-3xl font-bold text-on-surface focus:ring-0 placeholder:text-outline-variant rounded-xl"
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    min="0"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2" htmlFor="title">Bill Title</label>
                <Input
                  id="title"
                  className="block w-full px-4 py-4 bg-surface-container-lowest border border-outline-variant rounded-xl text-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary shadow-[0px_4px_20px_rgba(15,23,42,0.05)] placeholder:text-outline-variant transition-all"
                  placeholder="e.g. Dinner at Amore"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2" htmlFor="description">Description (Optional)</label>
                <Textarea
                  id="description"
                  className="block w-full px-4 py-4 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary shadow-[0px_4px_20px_rgba(15,23,42,0.05)] placeholder:text-outline-variant transition-all resize-none"
                  placeholder="Add some context..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                />
              </div>
            </div>
            <div className="flex-grow" />
            <div className="pt-6">
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="w-full flex items-center justify-center py-4 bg-primary text-primary-foreground rounded-xl text-lg font-semibold shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] hover:-translate-y-[1px] active:translate-y-[1px] active:shadow-sm transition-all"
              >
                Next <span className="ml-2">→</span>
              </Button>
            </div>
          </>
        )}

        {/* STEP 2: Add Participants */}
        {step === 1 && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-on-surface mb-3 tracking-[-0.01em]">Add Participants</h1>
              <p className="text-sm text-on-surface-variant">Who's splitting this bill with you?</p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full mb-6">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-outline" />
              </div>
              <Input
                className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-sm placeholder:text-on-surface-variant text-on-surface transition-all outline-none shadow-[0px_4px_20px_rgba(15,23,42,0.05)]"
                placeholder="Search by name or phone number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Quick Add */}
            {filteredContacts.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Quick Add</h2>
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5">
                  {filteredContacts.slice(0, 8).map((c) => (
                    <button
                      key={c.name}
                      onClick={() => {
                        setParticipants([...participants, { name: c.name, amount: "" }]);
                        setSearchQuery("");
                      }}
                      className="flex flex-col items-center gap-2 cursor-pointer group flex-shrink-0"
                    >
                      <div className="w-14 h-14 rounded-full bg-surface-container-high border-2 border-transparent group-hover:border-primary transition-colors flex items-center justify-center text-lg font-bold text-on-surface-variant">
                        {c.name[0].toUpperCase()}
                      </div>
                      <span className="text-sm text-on-surface">{c.name}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => setParticipants([...participants, { name: "", amount: "" }])}
                    className="flex flex-col items-center gap-2 cursor-pointer group flex-shrink-0"
                  >
                    <div className="w-14 h-14 rounded-full bg-surface-container-high border-2 border-transparent group-hover:border-primary transition-colors flex items-center justify-center text-outline">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <span className="text-sm text-on-surface">New</span>
                  </button>
                </div>
              </div>
            )}

            {/* Selected */}
            <div className="flex-1">
              <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Selected ({validCount})</h2>
              <div className="flex flex-col gap-3">
                {participants.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-container/20 text-primary flex items-center justify-center text-sm font-semibold">
                        {p.name ? p.name[0].toUpperCase() : "?"}
                      </div>
                      {i === 0 ? (
                        <span className="text-sm font-semibold text-on-surface">You</span>
                      ) : (
                        <Input
                          value={p.name}
                          onChange={(e) => {
                            const next = [...participants];
                            next[i] = { ...next[i], name: e.target.value };
                            setParticipants(next);
                          }}
                          placeholder="Name"
                          className="border-0 bg-transparent focus:ring-0 p-0 h-auto text-sm font-semibold text-on-surface"
                        />
                      )}
                    </div>
                    {i !== 0 && (
                      <button
                        onClick={() => setParticipants(participants.filter((_, idx) => idx !== i))}
                        className="text-error hover:bg-error-container/20 p-1 rounded-full transition-colors flex items-center justify-center"
                      >
                        <span className="text-lg">✕</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Split Method */}
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

            <div className="pt-4">
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="w-full flex items-center justify-center py-4 bg-primary text-primary-foreground rounded-xl text-lg font-semibold shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] hover:-translate-y-[1px] active:translate-y-[1px] active:shadow-sm transition-all"
              >
                Next Step <span className="ml-2">→</span>
              </Button>
            </div>
          </>
        )}

        {/* STEP 3: Review */}
        {step === 2 && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-on-surface mb-3 tracking-[-0.01em]">Review & Create</h1>
              <p className="text-sm text-on-surface-variant">Double-check before sharing.</p>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] mb-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-on-surface-variant">Bill</span>
                <span className="text-sm font-semibold text-on-surface">{title}</span>
              </div>
              {description && (
                <div className="flex justify-between">
                  <span className="text-sm text-on-surface-variant">Description</span>
                  <span className="text-sm text-on-surface text-right max-w-[60%]">{description}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-outline-variant pt-3">
                <span className="text-sm text-on-surface-variant">Total</span>
                <span className="text-lg font-bold text-primary">RM{total.toFixed(2)}</span>
              </div>
              {validCount >= 2 && (
                <div className="flex justify-between">
                  <span className="text-sm text-on-surface-variant">Per person</span>
                  <span className="text-sm font-semibold text-on-surface">RM{perPerson.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)]">
              <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Participants</h3>
              <div className="space-y-2">
                {participants.filter((p) => p.name.trim()).map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary flex items-center justify-center text-xs font-bold">
                        {p.name[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-on-surface">{p.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-on-surface">
                      RM{(parseFloat(p.amount) || perPerson).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-error bg-error-container/20 rounded-lg p-3 mt-4">{error}</p>}

            <div className="flex-grow" />
            <div className="pt-6 space-y-3">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full flex items-center justify-center py-4 bg-primary text-primary-foreground rounded-xl text-lg font-semibold shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] hover:-translate-y-[1px] active:translate-y-[1px] active:shadow-sm transition-all"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Bill & Share"}
              </Button>
              <Button variant="ghost" onClick={() => setStep(1)} className="w-full text-on-surface-variant">
                Back
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
