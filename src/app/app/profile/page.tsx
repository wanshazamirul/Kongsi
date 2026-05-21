"use client";

import { useState, useEffect, useRef } from "react";
import { User, Sun, Moon, Trash2, CreditCard, Shield, Bell, HelpCircle, ChevronRight, Upload } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "@/components/top-bar";
import { getDeviceId, getDeviceName, setDeviceName } from "@/lib/device-id";
import { convertToWebP } from "@/lib/image-utils";

export default function ProfilePage() {
  const [dark, setDark] = useState(false);
  const [billCount, setBillCount] = useState(0);
  const [totalSettled, setTotalSettled] = useState(0);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setName(getDeviceName() || "You");
    try {
      const bills = JSON.parse(localStorage.getItem("kongsi_bills") || "[]");
      setBillCount(bills.length);
      setTotalSettled(bills.reduce((s: number, b: any) => s + (b.total_amount || 0), 0));
    } catch {}
    // Load saved avatar
    const savedAvatar = localStorage.getItem("kongsi_avatar");
    if (savedAvatar) setAvatar(savedAvatar);
  }, []);

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
      };
      reader.readAsDataURL(webp);
    } catch {}
  }

  async function saveName() {
    if (!name.trim()) return;
    setSaving(true);
    setDeviceName(name.trim());

    // Register with PB
    try {
      const deviceId = getDeviceId();
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId, name: name.trim() }),
      });
      toast.success("Profile saved!");
    } catch {
      // Still works locally
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
    setBillCount(0);
    setTotalSettled(0);
    setAvatar(null);
    setName("You");
    toast.success("All data cleared");
  }

  const settingsItems = [
    { icon: CreditCard, label: "Payment Methods", onClick: () => toast.success("Coming soon!") },
    { icon: Shield, label: "Security", onClick: () => toast.success("Coming soon!") },
    { icon: Bell, label: "Notifications", onClick: () => toast.success("Coming soon!") },
    { icon: HelpCircle, label: "Help & Support", onClick: () => toast.success("Coming soon!") },
  ];

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
            <button onClick={toggleTheme} className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors active:scale-[0.99]">
              <div className="flex items-center gap-4">
                {dark ? <Sun className="w-5 h-5 text-on-surface-variant" /> : <Moon className="w-5 h-5 text-on-surface-variant" />}
                <span className="text-sm text-on-surface">{dark ? "Light Mode" : "Dark Mode"}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-on-surface-variant" />
            </button>
            {settingsItems.map((item) => (
              <button key={item.label} onClick={item.onClick} className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors active:scale-[0.99]">
                <div className="flex items-center gap-4">
                  <item.icon className="w-5 h-5 text-on-surface-variant" />
                  <span className="text-sm text-on-surface">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant" />
              </button>
            ))}
          </div>
        </section>

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
