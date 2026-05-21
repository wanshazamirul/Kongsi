# Implementation Plan: Kongsi Emerald Redesign

**Date**: 2026-05-21
**Author**: Shuhada
**Status**: Ready
**Design Doc**: `docs/plans/2026-05-21-redesign-emerald-fintech.md`

## Overview

Remove kopitiam amber/orange aesthetic entirely. Replace with dark-default emerald green fintech design. Update app icon. 18 files to modify + 1 new component.

## Color Mapping Reference

| Old (amber) | New (emerald) |
|---|---|
| `bg-amber-500`, `bg-amber-600` | `bg-emerald-600`, `bg-emerald-700` |
| `text-amber-400`, `text-amber-600` | `text-emerald-400`, `text-emerald-500` |
| `border-amber-200`, `border-amber-500/30` | `border-emerald-200`, `border-emerald-500/30` |
| `bg-amber-50`, `bg-amber-500/5`, `bg-amber-500/10` | `bg-emerald-50`, `bg-emerald-500/5`, `bg-emerald-500/10` |
| `bg-amber-100` | `bg-emerald-100` |
| `from-amber-700 via-amber-500 to-amber-400` | `from-emerald-700 via-emerald-500 to-emerald-400` |
| `bg-amber-200/60`, `bg-amber-200/40`, `bg-amber-200/30` | `bg-emerald-200/60`, `bg-emerald-200/40`, `bg-emerald-200/30` |
| `text-amber-900/20` | `text-emerald-900/20` |
| `text-red-400/80 border-red-400/80` (PaidStamp) | `text-emerald-400/80 border-emerald-400/80` |

## Tasks

- [ ] 1. Copy app icon to public/
- [ ] 2. Update layout.tsx metadata + favicon
- [ ] 3. Rewrite globals.css — full CSS variable replacement
- [ ] 4. Create progress-ring.tsx component
- [ ] 5. Redesign paid-stamp.tsx → premium fintech seal
- [ ] 6. Recolor confetti-burst.tsx → emerald/lime/gold
- [ ] 7. Redesign bottom-nav.tsx — amber → emerald
- [ ] 8. Redesign theme-toggle.tsx — amber → emerald
- [ ] 9. Redesign landing page (app/page.tsx) — Coffee → new icon, amber → emerald
- [ ] 10. Redesign app home (app/app/page.tsx) — Coffee → icon, amber → emerald
- [ ] 11. Redesign create page (app/app/create/page.tsx) — amber → emerald
- [ ] 12. Redesign scan page (app/app/scan/page.tsx) — amber → emerald
- [ ] 13. Redesign history page (app/app/history/page.tsx) — amber → emerald
- [ ] 14. Redesign public bill page (b/[id]/page.tsx) — Coffee → icon, ProgressKopi → ProgressRing, modal → inline confirmation
- [ ] 15. Redesign dashboard page (b/[id]/dashboard/page.tsx) — Coffee → icon, ProgressKopi → ProgressRing, amber → emerald
- [ ] 16. Verification — build check + grep for remaining amber/coffee references
- [ ] 17. Commit

---

## Task Details

### 1. Copy app icon to public/
- Copy `C:\Users\Shazwan\Downloads\expense_3201092.png` → `public/icon.png`
- Also save as `public/favicon.ico` (same file)
- Leave existing SVGs (file.svg, globe.svg, etc.) — they're Vercel boilerplate

### 2. Update layout.tsx metadata + favicon
- Add `icons: { icon: "/icon.png" }` to metadata export
- No other changes needed

### 3. Rewrite globals.css
- Replace ALL CSS variable values in `:root` and `.dark` blocks
- New light mode: emerald-tinted neutrals, emerald primary, clean white surfaces
- New dark mode: near-black emerald-tinted bg, lighter surfaces for elevation, mint primary
- Remove comments referencing kopitiam/mamak
- Font stack stays the same

**New CSS variables:**
```css
:root {
  --background: oklch(0.985 0.003 160);
  --foreground: oklch(0.15 0.01 160);
  --card: oklch(0.995 0 0);
  --card-foreground: oklch(0.15 0.01 160);
  --popover: oklch(0.995 0 0);
  --popover-foreground: oklch(0.15 0.01 160);
  --primary: oklch(0.52 0.16 160);
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.95 0.005 160);
  --secondary-foreground: oklch(0.15 0.01 160);
  --muted: oklch(0.95 0.005 160);
  --muted-foreground: oklch(0.48 0.008 160);
  --accent: oklch(0.93 0.02 160);
  --accent-foreground: oklch(0.15 0.01 160);
  --destructive: oklch(0.5 0.18 25);
  --border: oklch(0.9 0.005 160);
  --input: oklch(0.9 0.005 160);
  --ring: oklch(0.52 0.16 160);
  --chart-1: oklch(0.52 0.16 160);
  --chart-2: oklch(0.46 0.14 160);
  --chart-3: oklch(0.4 0.12 160);
  --chart-4: oklch(0.34 0.1 160);
  --chart-5: oklch(0.28 0.08 160);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0.003 160);
  --sidebar-foreground: oklch(0.15 0.01 160);
  --sidebar-primary: oklch(0.52 0.16 160);
  --sidebar-primary-foreground: oklch(0.99 0 0);
  --sidebar-accent: oklch(0.95 0.005 160);
  --sidebar-accent-foreground: oklch(0.15 0.01 160);
  --sidebar-border: oklch(0.9 0.005 160);
  --sidebar-ring: oklch(0.52 0.16 160);
}

.dark {
  --background: oklch(0.14 0.008 160);
  --foreground: oklch(0.93 0.003 160);
  --card: oklch(0.18 0.008 160);
  --card-foreground: oklch(0.93 0.003 160);
  --popover: oklch(0.18 0.008 160);
  --popover-foreground: oklch(0.93 0.003 160);
  --primary: oklch(0.62 0.15 160);
  --primary-foreground: oklch(0.14 0.008 160);
  --secondary: oklch(0.22 0.005 160);
  --secondary-foreground: oklch(0.93 0.003 160);
  --muted: oklch(0.22 0.005 160);
  --muted-foreground: oklch(0.55 0.008 160);
  --accent: oklch(0.22 0.015 160);
  --accent-foreground: oklch(0.93 0.003 160);
  --destructive: oklch(0.55 0.18 25);
  --border: oklch(0.24 0.008 160);
  --input: oklch(0.24 0.008 160);
  --ring: oklch(0.62 0.15 160);
  --chart-1: oklch(0.62 0.15 160);
  --chart-2: oklch(0.55 0.12 160);
  --chart-3: oklch(0.48 0.1 160);
  --chart-4: oklch(0.4 0.08 160);
  --chart-5: oklch(0.32 0.06 160);
  --sidebar: oklch(0.18 0.008 160);
  --sidebar-foreground: oklch(0.93 0.003 160);
  --sidebar-primary: oklch(0.62 0.15 160);
  --sidebar-primary-foreground: oklch(0.14 0.008 160);
  --sidebar-accent: oklch(0.22 0.005 160);
  --sidebar-accent-foreground: oklch(0.93 0.003 160);
  --sidebar-border: oklch(0.24 0.008 160);
  --sidebar-ring: oklch(0.62 0.15 160);
}
```

### 4. Create progress-ring.tsx
New file at `src/components/progress-ring.tsx`:
- SVG donut/circle with stroke-dasharray for progress
- Emerald gradient on the ring (`oklch(0.52 0.16 160)` to `oklch(0.65 0.16 160)`)
- Animated on progress change (ease-out-expo, 600ms)
- Large percentage number in center
- Label below
- Props: `progress: number` (0-100), `label: string`, `sublabel?: string`
- Use Framer Motion's `useMotionValue` + `useSpring` for smooth number counting

SVG structure:
```tsx
<svg viewBox="0 0 120 120" className="w-32 h-32">
  <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" className="text-muted" strokeWidth="8" />
  <motion.circle cx="60" cy="60" r="52" fill="none" stroke="url(#emeraldGradient)" strokeWidth="8"
    strokeLinecap="round" strokeDasharray={`${2*Math.PI*52}`} strokeDashoffset={...}
    transform="rotate(-90 60 60)" />
</svg>
```

### 5. Redesign paid-stamp.tsx
- Change from red "PAID" stamp to emerald green checkmark seal
- Replace `border-red-400/80 text-red-400/80` with `border-emerald-400/80 text-emerald-400/80`
- Add `CheckCircle2` icon alongside text
- Keep spring animation (stiffness: 200, damping: 12)
- Slightly more compact, more premium feel

### 6. Recolor confetti-burst.tsx
- Replace `COLORS` array: `["#f59e0b", "#ef4444", ...]` → emerald/lime/gold palette
- New: `["#10b981", "#059669", "#84cc16", "#fbbf24", "#34d399", "#a3e635", "#facc15"]`
- Keep particle count (40), spread, animation curves

### 7. Redesign bottom-nav.tsx
Find and replace all amber references:
- `text-amber-600 dark:text-amber-400` → `text-emerald-500 dark:text-emerald-400` (active link)
- `bg-amber-500 hover:bg-amber-600` → `bg-emerald-600 hover:bg-emerald-700` (scan button)
- Scan button glow: tweak shadow to emerald-500/30

### 8. Redesign theme-toggle.tsx
- Sun icon: `text-amber-400` → `text-emerald-400`

### 9-15. Redesign all pages
For each page file:
- Replace all `Coffee` icon imports and usages → `Receipt` or `Split` icon
- Replace all amber color classes → emerald (per color mapping table above)
- Replace `ProgressKopi` import/usage → `ProgressRing` (in bill + dashboard pages)
- Replace `PaidStamp` (update with new emerald colors)
- Create page: dashed scan button border/text → emerald
- Scan page: upload area border/icon/text → emerald
- Public bill page: change modal confirmation to cleaner inline design
- Public bill page: update `text-amber-400` on total amount to `text-emerald-400`

### 16. Verification
```bash
# Check for remaining amber/coffee references
grep -ri "amber\|coffee\|kopi" src/ --include="*.tsx" --include="*.ts" --include="*.css"
# Should return empty or only intentional references
```
Run `npx next build` to verify no compilation errors.

### 17. Commit
```
redesign: kopitiam amber → emerald fintech

Replace amber/orange kopitiam aesthetic with dark-default emerald green
design. New SVG progress ring, premium paid seal, recolor confetti.
Update app icon and favicon.

- globals.css: full OKLCH variable replacement (emerald-tinted neutrals)
- progress-ring.tsx: new animated SVG donut component
- All pages/components: Coffee → Receipt, amber → emerald classes
- paid-stamp: red → emerald premium seal
- confetti-burst: emerald/lime/gold palette
- App icon: expense_3201092.png
```
