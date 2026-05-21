import Link from "next/link";
import { Receipt, ScanLine, Share2, Users, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="px-6 pt-24 pb-16 md:pt-36 md:pb-24 max-w-2xl mx-auto text-center">
        <div className="mb-8 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">
          <Receipt className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
          Split. Share.{" "}
          <span className="text-emerald-500 dark:text-emerald-400">Settled.</span>
        </h1>

        <p className="text-base text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed">
          The Malaysian way to split expenses. Scan a restaurant receipt, share via WhatsApp, and track who paid. No login, no app install.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/app"
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
          >
            Open App
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
          <Link
            href="/app/scan"
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-border hover:bg-muted transition-colors font-medium"
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
            { step: "3", icon: Users, title: "Track who paid", desc: "Dashboard shows progress in real-time with a clean progress ring and participant status." },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-0.5">{item.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            No login required. Just a link. Built for WhatsApp.
          </p>
        </div>
      </section>
    </div>
  );
}
