"use client";

import { motion } from "framer-motion";

export function PaidStamp() {
  return (
    <motion.div
      initial={{ scale: 2.5, rotate: -25, opacity: 0 }}
      animate={{ scale: 1, rotate: -8, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 12 }}
      className="absolute top-2 right-2 pointer-events-none select-none"
    >
      <div className="border-4 border-red-400/80 text-red-400/80 rounded-lg px-3 py-1.5 -rotate-12">
        <span className="text-lg font-black tracking-widest font-mono">PAID</span>
      </div>
    </motion.div>
  );
}
