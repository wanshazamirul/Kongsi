"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ["#10b981", "#059669", "#84cc16", "#fbbf24", "#34d399", "#a3e635", "#facc15"];

function randomBetween(a: number, b: number) {
  return Math.random() * (b - a) + a;
}

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
}

export function ConfettiBurst({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const items: Particle[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: randomBetween(-120, 120),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: randomBetween(0, 0.4),
      rotation: randomBetween(-360, 360),
    }));
    setParticles(items);
    const timer = setTimeout(() => setParticles([]), 2500);
    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: 0, x: 0, rotate: 0, scale: 0.8 }}
              animate={{
                opacity: 0,
                y: randomBetween(-300, -100),
                x: p.x,
                rotate: p.rotation,
                scale: [0.8, 1.2, 0],
              }}
              transition={{ duration: randomBetween(1.5, 2.5), delay: p.delay, ease: "easeOut" }}
              className="absolute w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: p.color }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
