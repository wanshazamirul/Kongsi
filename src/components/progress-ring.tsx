"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

interface Props {
  progress: number;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({ progress, label, sublabel }: Props) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 100);

  const motionProgress = useMotionValue(0);
  const springProgress = useSpring(motionProgress, { stiffness: 80, damping: 15 });
  const displayProgress = useTransform(springProgress, (v) => Math.round(v));

  useEffect(() => {
    motionProgress.set(clamped);
  }, [clamped, motionProgress]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="oklch(0.48 0.2 280)" />
              <stop offset="100%" stopColor="oklch(0.6 0.18 280)" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r={radius} fill="none" className="text-surface-container-high" stroke="currentColor" strokeWidth="8" />
          <motion.circle
            cx="50" cy="50" r={radius} fill="none" stroke="url(#ringGradient)" strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (clamped / 100) * circumference }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span className="text-lg font-bold tracking-tight tabular-nums text-on-surface">
            {displayProgress}
          </motion.span>
          <span className="text-xs text-on-surface">%</span>
        </div>
      </div>
      {label && <p className="text-xs font-semibold text-on-surface">{label}</p>}
      {sublabel && <p className="text-[10px] text-on-surface-variant">{sublabel}</p>}
    </div>
  );
}
