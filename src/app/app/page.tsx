"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Receipt, Plus } from "lucide-react";
import { formatRM } from "@/lib/utils";
import { TopBar } from "@/components/top-bar";

interface SavedBill {
  id: string;
  title: string;
  total_amount: number;
  created: string;
  admin_token: string;
}

export default function AppHomePage() {
  const router = useRouter();
  const [bills, setBills] = useState<SavedBill[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("kongsi_bills");
      if (stored) setBills(JSON.parse(stored));
    } catch {}
  }, []);

  const fileRef = useRef<HTMLInputElement>(null);
  const totalOutstanding = bills.reduce((sum, b) => sum + b.total_amount, 0);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      sessionStorage.setItem("kongsi_scan_image", reader.result as string);
      router.push("/app/scan");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="min-h-screen pb-24">
      <TopBar />
      <div className="max-w-3xl mx-auto px-5 flex flex-col gap-8">
      {/* Total Outstanding Bento Card */}
      <section className="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        {/* Decorative background blob */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
        <div className="flex flex-col gap-3 z-10 w-full md:w-auto text-center md:text-left">
          <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Outstanding</h2>
          <p className="text-5xl font-bold text-primary tracking-[-0.02em]">RM{totalOutstanding.toFixed(2)}</p>
          {bills.length > 0 && (
            <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
              <span className="inline-flex items-center gap-1 bg-success-container/20 text-on-success-container px-2 py-1 rounded-full text-xs font-semibold">
                ↑ {bills.length} active {bills.length === 1 ? "bill" : "bills"}
              </span>
            </div>
          )}
        </div>
        {/* Bill count ring */}
        <div className="relative w-32 h-32 flex-shrink-0 z-10 mx-auto md:mx-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle className="text-surface-container-high" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8" />
            <circle className="text-primary" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={bills.length === 0 ? 251.2 : Math.max(251.2 - (bills.length / Math.max(bills.length + 1, 1)) * 251.2, 0)} strokeWidth="8" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold text-on-surface">{bills.length}</span>
            <span className="text-[10px] font-semibold text-on-surface-variant uppercase">{bills.length === 1 ? "Bill" : "Bills"}</span>
          </div>
        </div>
      </section>

      {/* Quick Actions Grid */}
      <section className="grid grid-cols-3 gap-3 md:gap-4">
        <button
          onClick={() => router.push("/app/create")}
          className="flex flex-col items-center justify-center gap-3 bg-surface-container-lowest p-4 rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] hover:-translate-y-1 transition-all group border border-transparent hover:border-primary/20"
        >
          <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-semibold text-on-surface text-center uppercase tracking-wider">Create New Bill</span>
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 bg-surface-container-lowest p-4 rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] hover:-translate-y-1 transition-all group border border-transparent hover:border-primary/20"
        >
          <div className="w-12 h-12 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="text-2xl">📄</span>
          </div>
          <span className="text-[10px] font-semibold text-on-surface text-center uppercase tracking-wider">Upload</span>
        </button>
        <button
          onClick={() => {
            if (bills.length > 0) {
              router.push(`/b/${bills[0].id}/dashboard?token=${bills[0].admin_token}`);
            }
          }}
          className="flex flex-col items-center justify-center gap-3 bg-surface-container-lowest p-4 rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] hover:-translate-y-1 transition-all group border border-transparent hover:border-primary/20"
        >
          <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="text-2xl">📢</span>
          </div>
          <span className="text-[10px] font-semibold text-on-surface text-center uppercase tracking-wider">Remind All</span>
        </button>
      </section>

      {/* Active Bills List */}
      {bills.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-on-surface">Active Bills</h3>
            <button onClick={() => router.push("/app/history")} className="text-xs font-semibold text-primary hover:underline">View All</button>
          </div>
          <div className="flex flex-col gap-3">
            {bills.map((bill) => (
              <div
                key={bill.id}
                onClick={() => router.push(`/b/${bill.id}/dashboard?token=${bill.admin_token}`)}
                className="bg-surface-container-lowest rounded-xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] transition-shadow cursor-pointer flex flex-col gap-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-5 h-5 text-on-surface-variant" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-on-surface">{bill.title}</h4>
                      <p className="text-xs text-on-surface-variant">Created {new Date(bill.created.replace(" ", "T")).toLocaleDateString("en-MY", { day: "numeric", month: "short" })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">{formatRM(bill.total_amount)}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success-container/20 text-on-success-container">
                      0/{formatRM(bill.total_amount)}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-2">
                  <div className="bg-success h-2 rounded-full" style={{ width: "0%" }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      </div>
    <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="absolute opacity-0 w-0 h-0 pointer-events-none" />
    </div>
  );
}
