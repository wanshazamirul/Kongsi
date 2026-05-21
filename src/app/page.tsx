"use client";

import { useRouter } from "next/navigation";
import { Receipt, Share2, Users, Zap, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950/20 to-background">
      {/* Hero */}
      <section className="relative px-6 pt-20 pb-16 md:pt-32 md:pb-24 max-w-2xl mx-auto text-center">
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <Coffee className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Kongsi{" "}
          <span className="text-amber-400">Bil</span>, Tak Payung
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
          Split bills the Malaysian way. Create a bill, share via WhatsApp, and
          track who paid — no login, no fuss.
        </p>
        <Button
          size="lg"
          className="rounded-full px-8 h-12 text-base bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          onClick={() => router.push("/create")}
        >
          Create a Bill
          <Receipt className="ml-2 w-4 h-4" />
        </Button>
      </section>

      {/* Features */}
      <section className="px-6 pb-24 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Receipt, title: "Create & Split", desc: "Add items or total amount, split by person, set a due date." },
            { icon: Share2, title: "Share via WhatsApp", desc: "One tap to share the bill link. Friends open and confirm — no app install." },
            { icon: Users, title: "Track Payments", desc: "See who paid and who hasn't. Progress bar fills up as payments come in." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card/50 p-5 hover:bg-card/80 transition-colors">
              <f.icon className="w-5 h-5 text-amber-400 mb-3" />
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground mb-6 flex items-center justify-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            No login. No app. Just a link.
          </p>
          <Button variant="outline" className="rounded-full" onClick={() => router.push("/create")}>
            Get Started
          </Button>
        </div>
      </section>
    </div>
  );
}
