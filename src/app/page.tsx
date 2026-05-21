"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Receipt, Share2, Users, Zap, Coffee, Plus, ArrowRight, ScanLine } from "lucide-react";
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

export default function LandingPage() {
  const router = useRouter();
  const [bills, setBills] = useState<SavedBill[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("kongsi_bills");
      if (stored) setBills(JSON.parse(stored));
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950/20 to-background">
      {/* Header */}
      <header className="px-4 pt-6 pb-2 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Coffee className="w-4 h-4 text-amber-400" />
            </div>
            <h1 className="text-lg font-bold">Kongsi</h1>
          </div>
          <Button
            size="sm"
            className="rounded-xl bg-amber-500 hover:bg-amber-600 text-black h-9"
            onClick={() => router.push("/create")}
          >
            <Plus className="w-4 h-4 mr-1" />
            New Bill
          </Button>
        </div>
      </header>

      {/* Recent bills or empty state */}
      <section className="px-4 pb-8 max-w-lg mx-auto">
        {bills.length === 0 ? (
          /* Empty state */
          <div className="pt-12 pb-8 text-center">
            <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500/5 border border-amber-500/10">
              <Receipt className="w-10 h-10 text-amber-400/60" />
            </div>
            <h2 className="text-xl font-bold mb-2">
              Kongsi <span className="text-amber-400">Bil</span>, Tak Payung
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto leading-relaxed">
              Split bills the Malaysian way. Scan a receipt, share via WhatsApp, track who paid — no login, no fuss.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                className="rounded-xl bg-amber-500 hover:bg-amber-600 text-black h-11"
                onClick={() => router.push("/scan")}
              >
                <ScanLine className="w-4 h-4 mr-2" />
                Scan Receipt
              </Button>
              <Button
                variant="outline"
                className="rounded-xl h-11"
                onClick={() => router.push("/create")}
              >
                Enter Manually
              </Button>
            </div>
          </div>
        ) : (
          /* Bill list */
          <div className="space-y-1">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">
              Recent Bills
            </h2>
            {bills.map((bill) => (
              <Card
                key={bill.id}
                className="p-4 hover:bg-card/80 transition-colors cursor-pointer group border-border/50"
                onClick={() => router.push(`/b/${bill.id}/dashboard?token=${bill.admin_token}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{bill.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(bill.created.replace(" ", "T")).toLocaleDateString("en-MY", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-semibold text-amber-400">{formatRM(bill.total_amount)}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Features (only on empty state or bottom) */}
        {bills.length > 0 && (
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: ScanLine, label: "Scan", onClick: () => router.push("/scan") },
              { icon: Receipt, label: "Manual", onClick: () => router.push("/create") },
              { icon: Share2, label: "Share", onClick: () => {} },
            ].map((f) => (
              <button
                key={f.label}
                onClick={f.onClick}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 hover:bg-card/80 transition-colors"
              >
                <f.icon className="w-5 h-5 text-amber-400" />
                <span className="text-[10px] font-medium text-muted-foreground">{f.label}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
