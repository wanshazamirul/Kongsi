"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Receipt, Plus, ArrowRight, ScanLine } from "lucide-react";
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
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <header className="px-4 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
            <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Kongsi</h1>
            <p className="text-[10px] text-muted-foreground leading-tight">Split. Share. Settled.</p>
          </div>
        </div>
        <Button
          size="sm"
          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-sm"
          onClick={() => router.push("/app/create")}
        >
          <Plus className="w-4 h-4 mr-1" />
          New Bill
        </Button>
      </header>

      {/* Content */}
      <section className="px-4 pb-8">
        {bills.length === 0 ? (
          /* First visit — guided actions */
          <div className="pt-16 pb-8 text-center">
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/10 flex items-center justify-center">
                <Receipt className="w-10 h-10 text-emerald-400/70" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-foreground">
                Split bills,{" "}
                <span className="text-emerald-500 dark:text-emerald-400">the easy way</span>
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Scan a restaurant receipt or enter manually. Share via WhatsApp. Track who paid.
              </p>
            </div>

            <div className="space-y-3 max-w-xs mx-auto">
              <Button
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                onClick={() => router.push("/app/scan")}
              >
                <ScanLine className="w-5 h-5 mr-2" />
                Scan Receipt
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl"
                onClick={() => router.push("/app/create")}
              >
                Enter Manually
              </Button>
            </div>

            <p className="mt-8 text-[11px] text-muted-foreground">
              No login. No app install. Just a link.
            </p>
          </div>
        ) : (
          /* Returning user — bill list */
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recent Bills
              </h2>
              <span className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-1">
              {bills.map((bill, i) => (
                <button
                  key={bill.id}
                  onClick={() => router.push(`/b/${bill.id}/dashboard?token=${bill.admin_token}`)}
                  className="w-full text-left p-4 bg-card hover:bg-muted/50 transition-colors border border-border/50 first:rounded-t-xl last:rounded-b-xl -mb-px group"
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
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span className="font-semibold text-emerald-500 dark:text-emerald-400">{formatRM(bill.total_amount)}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg"
                onClick={() => router.push("/app/scan")}
              >
                <ScanLine className="w-4 h-4 mr-1" />
                Scan
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg"
                onClick={() => router.push("/app/create")}
              >
                <Plus className="w-4 h-4 mr-1" />
                Manual
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
