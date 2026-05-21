"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Receipt, Plus, ArrowRight, ScanLine, QrCode, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatRM } from "@/lib/utils";

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

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <header className="px-5 pt-6 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-container/30 flex items-center justify-center">
            <Receipt className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-on-surface">Kongsi</h1>
            <p className="text-[10px] text-on-surface-variant leading-tight">Split. Share. Settled.</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="px-5 pb-8">
        {bills.length === 0 ? (
          /* First visit */
          <div className="pt-10 pb-8 text-center">
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-container/20 border border-primary/20 flex items-center justify-center">
                <Receipt className="w-10 h-10 text-primary/70" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-on-surface">
                Split bills,{" "}
                <span className="text-primary">the easy way</span>
              </h2>
              <p className="text-sm text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                Scan a restaurant receipt or enter manually. Share via WhatsApp. Track who paid.
              </p>
            </div>

            <div className="space-y-3 max-w-xs mx-auto">
              <Button
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-medium shadow-[0px_4px_12px_rgba(70,72,212,0.2)]"
                onClick={() => router.push("/app/scan")}
              >
                <ScanLine className="w-5 h-5 mr-2" />
                Scan Receipt
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-outline-variant text-on-surface"
                onClick={() => router.push("/app/create")}
              >
                Enter Manually
              </Button>
            </div>

            <p className="mt-8 text-[11px] text-on-surface-variant">
              No login. No app install. Just a link.
            </p>
          </div>
        ) : (
          /* Returning user — Quick actions + bill list */
          <div>
            {/* Quick actions grid */}
            <div className="grid grid-cols-3 gap-3 mb-6 mt-2">
              <button
                onClick={() => router.push("/app/create")}
                className="flex flex-col items-center justify-center gap-2 bg-surface-container-lowest p-4 rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 transition-all group border border-transparent hover:border-primary/20"
              >
                <div className="w-12 h-12 rounded-full bg-primary-container/20 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-semibold text-on-surface text-center uppercase tracking-wider">New Bill</span>
              </button>
              <button
                onClick={() => router.push("/app/scan")}
                className="flex flex-col items-center justify-center gap-2 bg-surface-container-lowest p-4 rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 transition-all group border border-transparent hover:border-primary/20"
              >
                <div className="w-12 h-12 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ScanLine className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-semibold text-on-surface text-center uppercase tracking-wider">Scan</span>
              </button>
              <button
                onClick={() => {
                  // Find most recent bill and remind all unpaid
                  if (bills.length > 0) {
                    router.push(`/b/${bills[0].id}/dashboard?token=${bills[0].admin_token}`);
                  }
                }}
                className="flex flex-col items-center justify-center gap-2 bg-surface-container-lowest p-4 rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 transition-all group border border-transparent hover:border-primary/20"
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Megaphone className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-semibold text-on-surface text-center uppercase tracking-wider">Dashboard</span>
              </button>
            </div>

            {/* Recent bills */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Active Bills</h2>
              <button onClick={() => router.push("/app/history")} className="text-xs text-primary font-semibold hover:underline">View All</button>
            </div>
            <div className="space-y-2">
              {bills.slice(0, 5).map((bill) => (
                <Card
                  key={bill.id}
                  className="p-4 bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0px_10px_30px_rgba(15,23,42,0.1)] transition-all cursor-pointer group"
                  onClick={() => router.push(`/b/${bill.id}/dashboard?token=${bill.admin_token}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                        <Receipt className="w-5 h-5 text-on-surface-variant" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{bill.title}</p>
                        <p className="text-xs text-on-surface-variant">
                          {new Date(bill.created.replace(" ", "T")).toLocaleDateString("en-MY", {
                            day: "numeric", month: "short",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">{formatRM(bill.total_amount)}</p>
                    </div>
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-2 mt-3">
                    <div className="bg-success h-2 rounded-full" style={{ width: "0%" }} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
