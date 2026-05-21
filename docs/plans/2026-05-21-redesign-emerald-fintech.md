# Kongsi Redesign — Modern Malaysian Fintech

**Date**: May 21, 2026
**Status**: Approved
**Source**: Impeccable (product register) + Cognitio web research

## Design Decisions

### Why Emerald Green
Fintech clichés are navy/gold or terminal-dark. Emerald green (`oklch(0.52 0.16 160)`) avoids both reflexes and matches the new app icon's accent. Green signals "money done right" without the corporate sterility of blue.

### Why Dark-Default
Scene: "A friend opens a WhatsApp link at a mamak at 10pm, phone at 40% brightness, thumb-scrolling to see if they owe RM 28 or RM 32." That forces dark-default. Light mode stays excellent for organizers creating bills during the day.

### Register: Product
This is app UI (dashboard, bill tracking, payment flow). Restrained color strategy applies — accent on CTAs and active states only. Consistency over surprise. Predictable layouts are features.

## Color System (OKLCH)

| Role | Light | Dark |
|---|---|---|
| Primary | `oklch(0.52 0.16 160)` emerald | `oklch(0.62 0.15 160)` mint |
| Background | `oklch(0.985 0.003 160)` | `oklch(0.14 0.008 160)` |
| Surface | `oklch(0.995 0 0)` | `oklch(0.18 0.008 160)` |
| Text primary | `oklch(0.15 0.01 160)` | `oklch(0.93 0.003 160)` |
| Text muted | `oklch(0.48 0.008 160)` | `oklch(0.55 0.008 160)` |
| Success | `oklch(0.58 0.16 145)` | `oklch(0.65 0.15 145)` |
| Border | `oklch(0.9 0.005 160)` | `oklch(0.24 0.008 160)` |

- Neutrals tinted toward emerald (chroma 0.003-0.01). No pure gray.
- 60-30-10 rule: accent on CTAs and active states only.

## Typography
- **Geist** via `next/font` — one family, sharp, modern
- Big numbers for amounts (text-5xl bold)
- Tighter scale (1.125 ratio) for UI labels
- System font fallback stack

## Component Changes

| Old | New |
|---|---|
| Coffee icons | Receipt/Split/Users icons (Lucide) |
| ProgressKopi (coffee fill) | SVG donut ring, emerald gradient |
| PaidStamp | Animated check seal, spring scale |
| Amber buttons | Emerald solid/ghost, rounded-xl |
| Modal payment confirm | Inline expand + green flash |
| Generic cards | Border + staggered list reveal |

## Anti-Slop (Impeccable bans)
- No side-stripe borders
- No gradient text
- No glassmorphism
- No identical card grids
- No modal as first thought
- No bounce/elastic animations

## Motion
- 150-250ms transitions (product UI speed)
- ease-out-expo for entrances, ease-in for exits
- Staggered list reveals (50ms per item, cap at 500ms total)
- Confetti: keep, recolor emerald/lime/gold

## Icon
- New app icon: `expense_3201092.png` (receipt + $ + arrows)
- Update favicon + PWA manifest icon
