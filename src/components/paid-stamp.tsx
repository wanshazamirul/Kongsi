"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export function PaidStamp() {
  return (
    <motion.div
      initial={{ scale: 2.5, rotate: -25, opacity: 0 }}
      animate={{ scale: 1, rotate: -6, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 12 }}
      className="absolute top-2 right-2 pointer-events-none select-none"
    >
      <div className="border-2 border-emerald-400/70 text-emerald-400/80 rounded-lg px-2.5 py-1 -rotate-6 flex items-center gap-1 bg-emerald-500/5">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="text-sm font-black tracking-widest font-mono">PAID</span>
      </div>
    </motion.div>
  );
}
