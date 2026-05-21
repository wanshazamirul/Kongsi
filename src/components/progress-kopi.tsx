"use client";

import { motion } from "framer-motion";
import { Coffee } from "lucide-react";

interface Props {
  progress: number; // 0-100
  label: string;
  sublabel?: string;
}

export function ProgressKopi({ progress, label, sublabel }: Props) {
  const filled = Math.max(progress, 2);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
      </div>

      {/* Coffee cup progress */}
      <div className="relative h-16 bg-muted rounded-2xl overflow-hidden border border-border">
        {/* Liquid fill */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-700 via-amber-500 to-amber-400"
          initial={{ height: "0%" }}
          animate={{ height: `${filled}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Foam/crema top */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-200/60 rounded-full" />
          {/* Bubbles */}
          {progress > 30 && (
            <>
              <motion.div
                className="absolute w-1.5 h-1.5 rounded-full bg-amber-200/40"
                animate={{ y: [0, -3, 0], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ left: "20%", top: "30%" }}
              />
              <motion.div
                className="absolute w-1 h-1 rounded-full bg-amber-200/30"
                animate={{ y: [0, -2, 0], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                style={{ left: "60%", top: "50%" }}
              />
            </>
          )}
        </motion.div>

        {/* Kopi cup handle */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-6 border-2 border-border rounded-r-full" />

        {/* Coffee icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Coffee className="w-5 h-5 text-amber-900/20" />
        </div>
      </div>

      {sublabel && (
        <p className="text-[11px] text-muted-foreground text-center">{sublabel}</p>
      )}
    </div>
  );
}
