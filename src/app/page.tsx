"use client";

import Link from "next/link";
import { Receipt, ScanLine, Share2, Users, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="px-6 pt-24 pb-16 md:pt-36 md:pb-24 max-w-2xl mx-auto text-center">
        <div className="mb-8 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-container/20 border border-primary/20">
          <Receipt className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-on-surface">
          Split. Share.{" "}
          <span className="text-primary">Settled.</span>
        </h1>

        <p className="text-base text-on-surface-variant mb-10 max-w-md mx-auto leading-relaxed">
          The Malaysian way to split expenses. Scan a restaurant receipt, share via WhatsApp, and track who paid. No login, no app install.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/app"
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-medium transition-all shadow-[0px_4px_12px_rgba(70,72,212,0.3)]"
          >
            Open App
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
          <Link
            href="/app/scan"
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors font-medium text-on-surface"
          >
            <ScanLine className="mr-2 w-4 h-4" />
            Scan a Receipt
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 pb-24 max-w-lg mx-auto">
        <div className="space-y-8">
          {[
            { step: "1", icon: ScanLine, title: "Scan or enter a bill", desc: "Take a photo of your restaurant receipt or type the items manually. AI reads the receipt for you." },
            { step: "2", icon: Share2, title: "Share via WhatsApp", desc: "Get a link. Send it to your group chat. Friends open it and tap to confirm their share." },
            { step: "3", icon: Users, title: "Track who paid", desc: "Dashboard shows progress in real-time with tabs, nudge buttons, and a clean status overview." },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-container/20 border border-primary/20 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-0.5 text-on-surface">{item.title}</p>
                <p className="text-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-outline-variant text-center">
          <p className="text-xs text-on-surface-variant">
            No login required. Just a link. Built for WhatsApp.
          </p>
        </div>
      </section>
    </div>
  );
}
