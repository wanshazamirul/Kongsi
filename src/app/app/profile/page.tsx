"use client";

import { useState, useEffect, useRef } from "react";
import { User, Sun, Moon, Trash2, CreditCard, HelpCircle, ChevronRight, Upload, ChevronDown, Banknote, QrCode, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { TopBar } from "@/components/top-bar";
import { getDeviceName, setDeviceName } from "@/lib/device-id";
import { convertToWebP } from "@/lib/image-utils";

interface PaymentMethod {
  qr: string | null;
  bankName: string;
  accountNumber: string;
}

const faqs = [
  {
    q: "What is Kongsi?",
    a: "Kongsi helps you split bills with friends. Create a bill, share the link, and friends pay their share. No accounts needed — just links and tokens.",
  },
  {
    q: "How do I create a bill?",
    a: "Tap the + button on the home screen. Add items manually or scan a receipt with AI. Assign who pays for each item, then share the link.",
  },
  {
    q: "How do friends pay?",
    a: "Each friend gets a unique link showing only their items. They scan your payment QR and upload a screenshot as proof. You approve it from the dashboard.",
  },
  {
    q: "Is my data safe?",
    a: "Your data is stored in your browser (localStorage) and on our secure server. No passwords or banking info is ever stored. Bills auto-expire after 30 days.",
  },
  {
    q: "How do I report an issue?",
    a: "DM Wan on WhatsApp or submit feedback via the Waldo app. Links are in the Help section below.",
  },
];

export default function ProfilePage() {
  const [dark, setDark] = useState(false);
  const [billCount, setBillCount] = useState(0);
  const [totalSettled, setTotalSettled] = useState(0);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const qrFileRef = useRef<HTMLInputElement>(null);

  // Payment Methods
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    try {
      const saved = localStorage.getItem("kongsi_payment_method");
      return saved ? JSON.parse(saved) : { qr: null, bankName: "", accountNumber: "" };
    } catch {
      return { qr: null, bankName: "", accountNumber: "" };
    }
  });
  const [qrUploading, setQrUploading] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);

  // FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setName(getDeviceName() || "You");
    try {
      const bills = JSON.parse(localStorage.getItem("kongsi_bills") || "[]");
      setBillCount(bills.length);
      setTotalSettled(bills.reduce((s: number, b: any) => s + (b.total_amount || 0), 0));
    } catch {}
    const savedAvatar = localStorage.getItem("kongsi_avatar");
    if (savedAvatar) setAvatar(savedAvatar);
  }, []);

  function savePaymentMethod(update: Partial<PaymentMethod>) {
    const next = { ...paymentMethod, ...update };
    setPaymentMethod(next);
    localStorage.setItem("kongsi_payment_method", JSON.stringify(next));
  }

  async function handleQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrUploading(true);
    try {
      const bitmap = await createImageBitmap(file);
      const maxDim = 512;
      let { width, height } = bitmap;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
          "image/webp",
          0.6,
        );
      });

      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      savePaymentMethod({ qr: base64 });
      toast.success("Payment QR saved!");
    } catch {
      toast.error("Failed to process image");
    }
    setQrUploading(false);
    e.target.value = "";
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const webp = await convertToWebP(file);
      const reader = new FileReader();
      reader.onload = () => {
        const data = reader.result as string;
        setAvatar(data);
        localStorage.setItem("kongsi_avatar", data);
        try {
          const contacts = JSON.parse(localStorage.getItem("kongsi_contacts") || "[]");
          const youIdx = contacts.findIndex((c: any) => c.name === "You");
          if (youIdx >= 0) contacts[youIdx].avatar = data;
          else contacts.push({ name: "You", avatar: data });
          localStorage.setItem("kongsi_contacts", JSON.stringify(contacts));
        } catch {}
      };
      reader.readAsDataURL(webp);
    } catch {}
  }

  async function saveName() {
    if (!name.trim()) return;
    setSaving(true);
    setDeviceName(name.trim());
    try {
      const { getDeviceId } = await import("@/lib/device-id");
      const deviceId = getDeviceId();
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId, name: name.trim() }),
      });
      toast.success("Profile saved!");
    } catch {
      toast.success("Name saved locally");
    }
    setSaving(false);
    setEditing(false);
  }

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("kongsi-theme", next ? "dark" : "light");
  }

  function clearAllData() {
    if (!confirm("Clear all local data? This can't be undone.")) return;
    localStorage.removeItem("kongsi_bills");
    localStorage.removeItem("kongsi_contacts");
    localStorage.removeItem("kongsi_avatar");
    localStorage.removeItem("kongsi-theme");
    localStorage.removeItem("kongsi_user_name");
    localStorage.removeItem("kongsi_payment_method");
    localStorage.removeItem("kongsi_sent_reminders");
    setBillCount(0);
    setTotalSettled(0);
    setAvatar(null);
    setName("You");
    setPaymentMethod({ qr: null, bankName: "", accountNumber: "" });
    toast.success("All data cleared");
  }

  return (
    <div className="min-h-screen pb-24">
      <TopBar />

      <main className="px-5 max-w-2xl mx-auto flex flex-col gap-6">
        {/* Profile Header */}
        <section className="flex flex-col items-center gap-4 mt-4">
          <div className="relative">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-32 h-32 rounded-full bg-primary-container/20 border-4 border-surface shadow-md overflow-hidden flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-primary" />
              )}
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 shadow-sm hover:opacity-80 active:scale-95 transition-all"
            >
              <Upload className="w-4 h-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} className="absolute opacity-0 w-0 h-0 pointer-events-none" />
          </div>
          <div className="text-center">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xl font-bold text-on-surface bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1 text-center focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                />
                <button onClick={saveName} disabled={saving} className="text-xs text-primary font-semibold hover:underline">
                  {saving ? "..." : "Save"}
                </button>
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-on-surface" onClick={() => setEditing(true)}>
                {name} <span className="text-xs text-primary font-normal cursor-pointer hover:underline">edit</span>
              </h1>
            )}
            <p className="text-sm text-on-surface-variant">Local account</p>
          </div>
        </section>

        {/* Stats Bento */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] flex flex-col gap-1">
            <div className="flex items-center gap-1 text-on-surface-variant">
              <span className="text-lg">💰</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider">Total Settled</span>
            </div>
            <div className="text-xl font-semibold text-primary">RM{totalSettled.toFixed(2)}</div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] flex flex-col gap-1">
            <div className="flex items-center gap-1 text-on-surface-variant">
              <span className="text-lg">📄</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider">Active Bills</span>
            </div>
            <div className="text-xl font-semibold text-success">{billCount}</div>
          </div>
        </section>

        {/* Settings List */}
        <section className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] overflow-hidden">
          <div className="divide-y divide-outline-variant">

            {/* Payment Methods */}
            <div>
              <button
                onClick={() => setEditingPayment(!editingPayment)}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-4">
                  <CreditCard className="w-5 h-5 text-on-surface-variant" />
                  <div className="text-left">
                    <span className="text-sm text-on-surface">Payment Methods</span>
                    {!editingPayment && paymentMethod.qr && (
                      <p className="text-[10px] text-on-surface-variant mt-0.5">
                        {paymentMethod.bankName || "QR saved"}
                        {paymentMethod.accountNumber && ` • ${paymentMethod.accountNumber}`}
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-on-surface-variant transition-transform ${editingPayment ? "rotate-90" : ""}`} />
              </button>

              <AnimatePresence>
                {editingPayment && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4">
                      {/* QR Upload */}
                      <div>
                        <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Payment QR Code</label>
                        {paymentMethod.qr ? (
                          <div className="flex items-center gap-4 mt-2">
                            <img src={paymentMethod.qr} alt="Payment QR" className="w-20 h-20 rounded-lg object-cover border border-outline-variant" />
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => qrFileRef.current?.click()}
                                className="text-xs text-primary font-semibold hover:underline text-left"
                              >
                                Replace QR
                              </button>
                              <button
                                onClick={() => savePaymentMethod({ qr: null })}
                                className="text-xs text-destructive font-semibold hover:underline text-left"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => qrFileRef.current?.click()}
                            disabled={qrUploading}
                            className="w-full flex items-center justify-center gap-2 py-4 mt-2 rounded-xl border-2 border-dashed border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary transition-colors"
                          >
                            {qrUploading ? (
                              <span className="text-sm">Processing...</span>
                            ) : (
                              <><QrCode className="w-5 h-5" /><span className="text-sm font-semibold">Upload QR Code</span></>
                            )}
                          </button>
                        )}
                        <p className="text-[10px] text-on-surface-variant mt-1.5">
                          Your bank QR — added to new bills automatically
                        </p>
                        <input ref={qrFileRef} type="file" accept="image/*" onChange={handleQrUpload} className="absolute opacity-0 w-0 h-0 pointer-events-none" />
                      </div>

                      {/* Bank Name */}
                      <div>
                        <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Bank / E-Wallet</label>
                        <div className="flex items-center gap-2 mt-2">
                          <Banknote className="w-4 h-4 text-on-surface-variant shrink-0" />
                          <input
                            value={paymentMethod.bankName}
                            onChange={(e) => savePaymentMethod({ bankName: e.target.value })}
                            placeholder="CIMB, Maybank, Touch 'n Go..."
                            className="flex-1 text-sm bg-transparent border-b border-outline-variant pb-1 outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/40"
                          />
                        </div>
                      </div>

                      {/* Account Number */}
                      <div>
                        <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Account Number (optional)</label>
                        <input
                          value={paymentMethod.accountNumber}
                          onChange={(e) => savePaymentMethod({ accountNumber: e.target.value })}
                          placeholder="1234 5678 9012"
                          className="w-full text-sm bg-transparent border-b border-outline-variant pb-1 mt-2 outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/40"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dark Mode */}
            <button onClick={toggleTheme} className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors active:scale-[0.99]">
              <div className="flex items-center gap-4">
                {dark ? <Sun className="w-5 h-5 text-on-surface-variant" /> : <Moon className="w-5 h-5 text-on-surface-variant" />}
                <span className="text-sm text-on-surface">{dark ? "Light Mode" : "Dark Mode"}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-on-surface-variant" />
            </button>

            {/* Help & Support */}
            <div>
              <button
                onClick={() => setOpenFaq(openFaq === null ? 0 : null)}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-4">
                  <HelpCircle className="w-5 h-5 text-on-surface-variant" />
                  <span className="text-sm text-on-surface">Help & Support</span>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <AnimatePresence>
          {openFaq !== null && (
            <motion.section
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden -mt-3"
            >
              <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] p-4 space-y-1">
                <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Frequently Asked Questions</h3>
                {faqs.map((faq, i) => (
                  <button
                    key={i}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-sm text-on-surface pr-4">{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-on-surface-variant shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                    </div>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden text-xs text-on-surface-variant leading-relaxed pb-2"
                        >
                          {faq.a}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </button>
                ))}

                {/* Feedback links */}
                <div className="border-t border-outline-variant pt-3 mt-2 space-y-2">
                  <a
                    href="https://wa.me/601110801631"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Report an issue via WhatsApp
                  </a>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Clear Data */}
        <section className="pb-6">
          <button onClick={clearAllData} className="w-full flex items-center justify-center gap-2 p-4 rounded-xl text-error bg-error-container/20 hover:bg-error-container/30 active:scale-[0.98] transition-all text-xs font-semibold uppercase tracking-wider">
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </button>
        </section>
      </main>
    </div>
  );
}
