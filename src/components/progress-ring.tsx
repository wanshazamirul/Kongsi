"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

interface Props {
  progress: number; // 0-100
  label: string;
  sublabel?: string;
}

export function ProgressRing({ progress, label, sublabel }: Props) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 100);

  const motionProgress = useMotionValue(0);
  const springProgress = useSpring(motionProgress, {
    stiffness: 80,
    damping: 15,
  });
  const displayProgress = useTransform(springProgress, (v) => Math.round(v));

  useEffect(() => {
    motionProgress.set(clamped);
  }, [clamped, motionProgress]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
          <defs>
            <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="oklch(0.52 0.16 160)" />
              <stop offset="100%" stopColor="oklch(0.62 0.15 160)" />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-muted"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Progress */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="url(#emeraldGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{
              strokeDashoffset: circumference - (clamped / 100) * circumference,
            }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        {/* Center percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {displayProgress}
          </motion.span>
          <span className="text-sm text-foreground">%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">{label}</p>
        {sublabel && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{sublabel}</p>
        )}
      </div>
    </div>
  );
}
