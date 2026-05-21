"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, ArrowRight, Trash2, Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRM } from "@/lib/utils";

interface SavedBill {
  id: string;
  title: string;
  total_amount: number;
  created: string;
  admin_token: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [bills, setBills] = useState<SavedBill[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("kongsi_bills");
      if (stored) setBills(JSON.parse(stored));
    } catch {}
  }, []);

  function clearHistory() {
    localStorage.removeItem("kongsi_bills");
    setBills([]);
  }

  if (bills.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="font-semibold text-lg">No bills yet</h2>
        <p className="text-sm text-muted-foreground text-center">
          Bills you create will appear here. Tap the scan button to get started.
        </p>
        <Button variant="outline" className="rounded-xl" onClick={() => router.push("/app/scan")}>
          <Receipt className="w-4 h-4 mr-2" />
          Scan a receipt
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          History
        </h1>
        <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>

      <div className="space-y-3">
        {bills.map((bill) => (
          <Card
            key={bill.id}
            className="p-4 hover:bg-card/80 transition-colors cursor-pointer group"
            onClick={() => router.push(`/b/${bill.id}/dashboard?token=${bill.admin_token}`)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{bill.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(bill.created.replace(" ", "T")).toLocaleDateString("en-MY", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-emerald-500 dark:text-emerald-400">{formatRM(bill.total_amount)}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
