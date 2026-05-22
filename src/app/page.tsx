"use client";

import Link from "next/link";
import { Receipt, ScanLine, Share2, Users, ArrowRight, Coffee, UtensilsCrossed, Banknote } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* ─── Hero ─── */}
      <section className="relative px-6 pt-16 pb-20 md:pt-28 md:pb-32 overflow-hidden">
        {/* Subtle decorative blob */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/3 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Left — Text + CTAs */}
            <div className="text-center md:text-left">
              <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-container/20 border border-primary/10">
                <Receipt className="w-7 h-7 text-primary" />
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-5 text-on-surface leading-[1.1]">
                Split bills{" "}
                <br className="hidden sm:block" />
                without the{" "}
                <span className="text-primary">headache</span>
              </h1>

              <p className="text-base sm:text-lg text-on-surface-variant mb-8 max-w-lg md:max-w-none leading-relaxed">
                The Malaysian way to split expenses. Scan a restaurant receipt,
                share via WhatsApp, and track who paid — no login, no app
                install, no drama.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link
                  href="/app"
                  className="group inline-flex items-center justify-center h-12 px-8 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-medium transition-all shadow-[0px_4px_16px_rgba(70,72,212,0.25)]"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/app/scan"
                  className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors font-medium text-on-surface"
                >
                  <ScanLine className="mr-2 w-4 h-4" />
                  Scan a Receipt
                </Link>
              </div>
            </div>

            {/* Right — Visual card mockup */}
            <div className="hidden md:flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[380px]">
                {/* Floating bill card */}
                <div className="relative bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-[0px_8px_32px_rgba(70,72,212,0.08)] p-6 z-10">
                  {/* Card header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <UtensilsCrossed className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-on-surface">
                        Nasi Kandar Squad
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Mamak lunch run
                      </p>
                    </div>
                    <span className="ml-auto text-xs font-medium text-success bg-success-container px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>

                  {/* Total */}
                  <div className="mb-4">
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
                      Total Bill
                    </p>
                    <p className="text-3xl font-bold text-on-surface">
                      RM 48.60
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-5">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-on-surface-variant">Collected</span>
                      <span className="font-medium text-on-surface">
                        2 of 4 paid
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full w-1/2 bg-primary rounded-full transition-all" />
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="space-y-2">
                    {[
                      { name: "Amir", amount: "RM 12.15", paid: true },
                      { name: "Sarah", amount: "RM 12.15", paid: true },
                      { name: "Danial", amount: "RM 12.15", paid: false },
                      { name: "You", amount: "RM 12.15", paid: false },
                    ].map((p) => (
                      <div
                        key={p.name}
                        className="flex items-center gap-3 text-sm"
                      >
                        <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-xs font-semibold text-on-surface-variant">
                          {p.name[0]}
                        </div>
                        <span className="flex-1 text-on-surface">
                          {p.name}
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          {p.amount}
                        </span>
                        {p.paid ? (
                          <span className="text-[10px] font-medium text-success bg-success-container/50 px-1.5 py-0.5 rounded">
                            Paid
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                            Pending
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating accent card behind */}
                <div className="absolute -top-4 -right-4 w-full h-full rounded-2xl bg-primary/5 border border-primary/10 -z-0" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              How it works
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-on-surface">
              Three steps, zero friction
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: ScanLine,
                title: "Scan or enter",
                desc: "Snap a photo of your restaurant receipt or type items manually. AI reads the receipt and fills everything in — mamak, dim sum, steamboat, you name it.",
              },
              {
                icon: Share2,
                title: "Share the link",
                desc: "One link. Send it to your WhatsApp group. Friends open it, see their share, and tap to confirm — no signup, no app to download.",
              },
              {
                icon: Users,
                title: "Track & settle",
                desc: "Dashboard shows who paid and who hasn't. Nudge the stragglers. When everyone's settled, confetti pops. Done and dusted.",
              },
            ].map((item, i) => (
              <div
                key={item.title}
                className="group relative bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 lg:p-8 hover:border-primary/20 hover:shadow-[0px_4px_20px_rgba(70,72,212,0.06)] transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/8 border border-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/12 transition-colors">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="font-semibold text-sm mb-2 text-on-surface">
                  {item.title}
                </p>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why Kongsi ─── */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-6 lg:p-8">
                <div className="space-y-5">
                  {[
                    {
                      icon: Coffee,
                      title: "Built for Malaysian food culture",
                      desc: "Mamak runs, yumcha sessions, group steamboat — we get how we makan together.",
                    },
                    {
                      icon: Banknote,
                      title: "No app, no login, no fuss",
                      desc: "Just a link. Friends don't need to install anything. Open in browser, tap to confirm.",
                    },
                    {
                      icon: Receipt,
                      title: "Receipt scanner powered by AI",
                      desc: "Snap any restaurant bill. Our AI reads items and prices — assign each item to whoever ordered it.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/8 border border-primary/10 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm mb-0.5 text-on-surface">
                          {item.title}
                        </p>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="order-1 md:order-2 text-center md:text-left">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
                Why Kongsi
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-on-surface mb-4">
                Split bills like a{" "}
                <span className="text-primary">true Malaysian</span>
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed max-w-md">
                Other bill-splitting apps are complicated. Kongsi is dead simple
                — built around how Malaysians actually pay for group meals and
                share expenses. Open a link, tap to pay. That's it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-outline-variant px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-on-surface">
              Kongsi
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-on-surface-variant">
            <Link
              href="/app"
              className="hover:text-on-surface transition-colors"
            >
              Open App
            </Link>
            <Link
              href="/app/scan"
              className="hover:text-on-surface transition-colors"
            >
              Scan Receipt
            </Link>
            <Link
              href="/app/history"
              className="hover:text-on-surface transition-colors"
            >
              History
            </Link>
          </div>

          <p className="text-xs text-on-surface-variant">
            Built in Malaysia 🇲🇾 · No login required
          </p>
        </div>
      </footer>
    </div>
  );
}
