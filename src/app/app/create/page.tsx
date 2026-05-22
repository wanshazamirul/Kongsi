"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search, UserPlus, Loader2, Check, X, Receipt, Trash2 } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Participant {
  name: string;
  amount: string;
}

interface SavedContact {
  name: string;
  avatar?: string;
}

interface LineItem {
  name: string;
  amount: string;
}

const STEPS = ["Bill Details", "Participants", "Review"];

export default function CreateBillPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  const [participants, setParticipants] = useState<Participant[]>(() => {
    try {
      const contacts = JSON.parse(localStorage.getItem("kongsi_contacts") || "[]");
      const names = contacts.slice(0, 10).map((c: { name: string }) => ({ name: c.name, amount: "" }));
      return [{ name: "You", amount: "" }, ...names];
    } catch { return [{ name: "You", amount: "" }]; }
  });
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentContacts] = useState<SavedContact[]>(() => {
    try { return JSON.parse(localStorage.getItem("kongsi_contacts") || "[]"); }
    catch { return []; }
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = parseFloat(totalAmount) || 0;
  const validCount = participants.filter((p) => p.name.trim()).length;

  // Line item calculations
  const itemsSubtotal = lineItems.reduce((s, li) => s + (parseFloat(li.amount) || 0), 0);
  const taxAndFees = total - itemsSubtotal;

  function canProceed(): boolean {
    if (step === 0) return title.trim().length > 0 && total > 0;
    if (step === 1) return participants.filter((p) => p.name.trim()).length >= 2;
    return true;
  }

  function handleNext() {
    if (step === 0) {
      // Auto-fill equal amounts going into step 2
      const valid = participants.filter((p) => p.name.trim());
      if (total > 0 && valid.length >= 2 && splitMode === "equal") {
        const pp = Math.round((total / valid.length) * 100) / 100;
        setParticipants(participants.map((p) => (p.name.trim() ? { ...p, amount: pp.toFixed(2) } : p)));
      }
      setStep(1);
    } else if (step === 1) {
      // Recalculate equal split in case things changed
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

    const parsed = participants
      .filter((p) => p.name.trim())
      .map((p) => ({
        name: p.name.trim(),
        amount: parseFloat(p.amount) || (total / validCount),
      }));

    const invalid = parsed.find((p) => !p.name || isNaN(p.amount) || p.amount < 0);
    if (invalid) { setError("Each participant needs a name and valid amount."); return; }
    if (total <= 0) { setError("Total amount must be greater than zero."); return; }

    // Fix rounding: ensure participant amounts sum to total
    const partsSum = parsed.reduce((s, p) => s + p.amount, 0);
    const diff = Math.round((total - partsSum) * 100) / 100;
    if (diff !== 0 && parsed.length > 0) {
      parsed[0].amount = Math.round((parsed[0].amount + diff) * 100) / 100;
    }

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

  function addLineItem() {
    setLineItems([...lineItems, { name: "", amount: "" }]);
  }

  function updateLineItem(i: number, field: keyof LineItem, value: string) {
    const next = [...lineItems];
    next[i] = { ...next[i], [field]: value };
    setLineItems(next);
  }

  function removeLineItem(i: number) {
    setLineItems(lineItems.filter((_, idx) => idx !== i));
  }

  const filteredContacts = recentContacts.filter(
    (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !participants.some((p) => p.name === c.name)
  );

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <TopBar showBack onBack={() => (step === 0 ? router.push("/app") : setStep(step - 1))} />

      <main className="flex-grow flex flex-col px-5 pb-24 max-w-lg mx-auto w-full">
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

        {/* ─── STEP 1: Bill Details + Line Items ─── */}
        {step === 0 && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-on-surface mb-2">Create new bill</h1>
              <p className="text-sm text-on-surface-variant">Enter the details and add line items.</p>
            </div>

            <div className="space-y-6">
              {/* Total Amount */}
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

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2" htmlFor="title">Bill Title</label>
                <Input
                  id="title"
                  className="block w-full px-4 py-5 bg-surface-container-lowest border border-outline-variant rounded-xl text-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary shadow-[0px_4px_20px_rgba(15,23,42,0.05)] placeholder:text-outline-variant transition-all"
                  placeholder="e.g. Dinner at Amore"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2" htmlFor="description">Description (Optional)</label>
                <Textarea
                  id="description"
                  className="block w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary shadow-[0px_4px_20px_rgba(15,23,42,0.05)] placeholder:text-outline-variant transition-all resize-none"
                  placeholder="Add some context..."
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                />
              </div>

              {/* ─── Line Items ─── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Line Items (Optional)</label>
                  <button
                    onClick={addLineItem}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>

                {lineItems.length === 0 && (
                  <button
                    onClick={addLineItem}
                    className="w-full py-3 border-2 border-dashed border-outline-variant rounded-xl text-xs text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    + Add items from the receipt
                  </button>
                )}

                {lineItems.length > 0 && (
                  <div className="space-y-2">
                    {lineItems.map((li, i) => (
                      <div key={i} className="flex items-center gap-2 bg-surface-container-lowest rounded-xl p-3 border border-outline-variant">
                        <Input
                          value={li.name}
                          onChange={(e) => updateLineItem(i, "name", e.target.value)}
                          placeholder="Item name"
                          className="flex-1 border-0 bg-transparent focus:ring-0 p-0 h-auto text-sm text-on-surface placeholder:text-outline-variant"
                        />
                        <div className="relative flex items-center">
                          <span className="text-xs text-on-surface-variant mr-1">RM</span>
                          <Input
                            value={li.amount}
                            onChange={(e) => updateLineItem(i, "amount", e.target.value)}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-20 border-0 bg-transparent focus:ring-0 p-0 h-auto text-sm font-semibold text-on-surface text-right placeholder:text-outline-variant"
                          />
                        </div>
                        <button onClick={() => removeLineItem(i)} className="p-1 text-on-surface-variant/40 hover:text-destructive transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tax breakdown — only show when line items exist and total is set */}
                {lineItems.length > 0 && total > 0 && (
                  <div className="mt-3 bg-surface-container-lowest rounded-xl p-3 border border-outline-variant space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-on-surface-variant">Items Subtotal</span>
                      <span className="text-on-surface font-medium">RM{itemsSubtotal.toFixed(2)}</span>
                    </div>
                    {taxAndFees !== 0 && (
                      <div className="flex justify-between text-xs">
                        <span className={taxAndFees > 0 ? "text-on-surface-variant" : "text-error"}>
                          {taxAndFees > 0 ? "Tax & Service" : "Shortfall"}
                        </span>
                        <span className={taxAndFees > 0 ? "text-on-surface font-medium" : "text-error font-medium"}>
                          {taxAndFees > 0 ? "+" : "-"}RM{Math.abs(taxAndFees).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs font-semibold border-t border-outline-variant pt-1.5">
                      <span className="text-on-surface">Total</span>
                      <span className="text-primary">RM{total.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-grow" />
            <div className="pt-6">
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="w-full flex items-center justify-center py-5 bg-primary text-primary-foreground rounded-xl text-lg font-semibold shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] hover:-translate-y-[1px] active:translate-y-[1px] active:shadow-sm transition-all"
              >
                Next <span className="ml-2">→</span>
              </Button>
            </div>
          </>
        )}

        {/* ─── STEP 2: Participants ─── */}
        {step === 1 && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-on-surface mb-2">Who's in?</h1>
              <p className="text-sm text-on-surface-variant">Select people to split with.</p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full mb-6">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-outline" />
              </div>
              <Input
                className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-sm placeholder:text-on-surface-variant text-on-surface transition-all outline-none shadow-[0px_4px_20px_rgba(15,23,42,0.05)]"
                placeholder="Search contacts"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Quick Add Contacts — round avatar grid */}
            {filteredContacts.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Quick Add</h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {filteredContacts.slice(0, 8).map((c) => (
                    <button
                      key={c.name}
                      onClick={() => {
                        setParticipants([...participants, { name: c.name, amount: "" }]);
                        setSearchQuery("");
                      }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group flex-shrink-0"
                    >
                      <div className="w-14 h-14 rounded-full bg-surface-container-high border-2 border-transparent group-hover:border-primary transition-all flex items-center justify-center overflow-hidden">
                        {c.avatar ? (
                          <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-on-surface-variant">{c.name[0].toUpperCase()}</span>
                        )}
                      </div>
                      <span className="text-xs text-on-surface">{c.name}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      const n = prompt("Add person:");
                      if (n?.trim()) {
                        setParticipants([...participants, { name: n.trim(), amount: "" }]);
                        try {
                          const contacts = JSON.parse(localStorage.getItem("kongsi_contacts") || "[]");
                          if (!contacts.some((c: any) => c.name.toLowerCase() === n.trim().toLowerCase())) {
                            contacts.push({ name: n.trim() });
                            localStorage.setItem("kongsi_contacts", JSON.stringify(contacts));
                          }
                        } catch {}
                      }
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group flex-shrink-0"
                  >
                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-outline-variant group-hover:border-primary flex items-center justify-center transition-colors">
                      <Plus className="w-6 h-6 text-outline group-hover:text-primary" />
                    </div>
                    <span className="text-xs text-primary">New</span>
                  </button>
                </div>
              </div>
            )}

            {/* Selected Participants */}
            <div className="flex-1">
              <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Selected ({validCount})</h2>
              <div className="flex flex-wrap gap-3">
                {participants.map((p, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center text-lg font-bold text-on-surface-variant border-2 border-transparent">
                        {p.name ? p.name[0].toUpperCase() : "?"}
                      </div>
                      {i !== 0 && (
                        <button
                          onClick={() => setParticipants(participants.filter((_, idx) => idx !== i))}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white rounded-full flex items-center justify-center shadow-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <span className="text-xs text-on-surface text-center max-w-[64px] truncate">
                      {i === 0 ? "You" : (p.name || "New")}
                    </span>
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
                className="w-full flex items-center justify-center py-5 bg-primary text-primary-foreground rounded-xl text-lg font-semibold shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] hover:-translate-y-[1px] active:translate-y-[1px] active:shadow-sm transition-all"
              >
                Review <span className="ml-2">→</span>
              </Button>
            </div>
          </>
        )}

        {/* ─── STEP 3: Review ─── */}
        {step === 2 && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-on-surface mb-2">Review & Create</h1>
              <p className="text-sm text-on-surface-variant">Double-check before sharing.</p>
            </div>

            {/* Bill summary card */}
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
            </div>

            {/* Line items breakdown */}
            {lineItems.length > 0 && (
              <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] mb-4">
                <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Line Items</h3>
                <div className="space-y-1.5">
                  {lineItems.filter(li => li.name.trim()).map((li, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-on-surface">{li.name}</span>
                      <span className="text-on-surface-variant">RM{(parseFloat(li.amount) || 0).toFixed(2)}</span>
                    </div>
                  ))}
                  {lineItems.filter(li => li.name.trim()).length > 0 && (
                    <>
                      <div className="flex justify-between text-xs text-on-surface-variant border-t border-outline-variant pt-1.5 mt-1">
                        <span>Subtotal</span>
                        <span>RM{itemsSubtotal.toFixed(2)}</span>
                      </div>
                      {taxAndFees !== 0 && (
                        <div className={`flex justify-between text-xs ${taxAndFees > 0 ? "text-on-surface-variant" : "text-error"}`}>
                          <span>{taxAndFees > 0 ? "Tax & Service" : "Shortfall"}</span>
                          <span>{taxAndFees > 0 ? "+" : "-"}RM{Math.abs(taxAndFees).toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Participants — round avatars with editable amounts */}
            <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)]">
              <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4">Participants</h3>
              <div className="space-y-3">
                {participants.filter((p) => p.name.trim()).map((p, i) => {
                  const amt = parseFloat(p.amount) || (total / validCount);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-sm font-bold text-on-surface-variant flex-shrink-0">
                        {p.name[0].toUpperCase()}
                      </div>
                      <span className="flex-1 text-sm font-medium text-on-surface truncate">
                        {i === 0 ? "You" : p.name}
                      </span>
                      <div className="relative flex items-center">
                        <span className="text-xs text-on-surface-variant mr-1">RM</span>
                        <Input
                          value={p.amount}
                          onChange={(e) => {
                            const next = [...participants];
                            next[i] = { ...next[i], amount: e.target.value };
                            setParticipants(next);
                            setSplitMode("custom");
                          }}
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-24 border border-outline-variant bg-transparent rounded-lg px-3 py-1.5 text-sm font-semibold text-on-surface text-right focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Split total verification */}
              {(() => {
                const partsTotal = participants
                  .filter(p => p.name.trim())
                  .reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
                const diff = total - partsTotal;
                if (Math.abs(diff) > 0.01) {
                  return (
                    <div className={`mt-3 flex justify-between text-xs p-2 rounded-lg ${diff > 0 ? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400" : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"}`}>
                      <span>{diff > 0 ? "Unallocated" : "Over allocated"}</span>
                      <span className="font-semibold">{diff > 0 ? "+" : ""}RM{diff.toFixed(2)}</span>
                    </div>
                  );
                }
                return (
                  <div className="mt-3 flex justify-between text-xs p-2 rounded-lg bg-success-container/20 text-success">
                    <span>All amounts balanced</span>
                    <span className="font-semibold">RM{total.toFixed(2)}</span>
                  </div>
                );
              })()}
            </div>

            {error && <p className="text-sm text-error bg-error-container/20 rounded-lg p-3 mt-4">{error}</p>}

            <div className="flex-grow" />
            <div className="pt-6 space-y-3">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full flex items-center justify-center py-5 bg-primary text-primary-foreground rounded-xl text-lg font-semibold shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] hover:-translate-y-[1px] active:translate-y-[1px] active:shadow-sm transition-all"
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
