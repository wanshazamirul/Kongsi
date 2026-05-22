# Kongsi — Architecture

Split bill payment tracker. Dutchie-inspired design system. KrackedDevs bounty (RM 500, deadline June 1, 2026).

## Stack

- **Framework**: Next.js 16 (App Router, TypeScript strict)
- **Styling**: Tailwind CSS v4 (OKLCH), shadcn/ui
- **Typography**: Inter (next/font/google)
- **Animation**: Framer Motion
- **Backend**: PocketBase (Docker, port 8098), Cloudflare Tunnel
- **AI**: Groq (Llama 4 Scout Vision for receipt scanning)
- **Deploy**: Vercel (kongsi.cognitio.my)

## Data Model

### kongsi_bills
| Field | Type | Notes |
|---|---|---|
| id | text (auto) | Primary key |
| title | text | Bill title |
| total_amount | number | Total to collect |
| description | text | Optional |
| due_date | date | Optional deadline |
| admin_token | text | Random token for dashboard access |

### kongsi_participants
| Field | Type | Notes |
|---|---|---|
| id | text (auto) | Primary key |
| bill_id | relation → kongsi_bills | Cascade delete |
| name | text | Participant name |
| amount | number | Their share |
| paid | bool | Default false |
| paid_at | date | When confirmed |

## Routes

| Route | Purpose | Auth |
|---|---|---|
| `/` | Landing page | None |
| `/app` | App home (quick actions + bill list) | None |
| `/app/create` | Multi-step bill creation (3 steps) | None |
| `/app/scan` | Receipt scanner with item-per-person assignment | None |
| `/app/history` | Past bills from localStorage | None |
| `/b/[id]` | Public bill page — Dutchie-style payment card | None |
| `/b/[id]/dashboard?token=xxx` | Organizer dashboard with tabs + nudge | Token |
| `/b/[id]/qr` | QR code payment page | None |
| `POST /api/bills` | Create bill + participants | None |
| `GET /api/bills/[id]` | Public bill data | None |
| `POST /api/bills/[id]/pay` | Confirm payment (mock) | None |
| `GET /api/bills/[id]/dashboard?token=xxx` | Dashboard data | Token |
| `DELETE /api/bills/[id]` | Delete bill + cascade participants | None |
| `POST /api/scan-receipt` | Groq Vision receipt OCR | None |

## Flow

1. Organizer creates bill via 3-step wizard (details+items → participants → review)
2. Step 1: Total amount, title, optional line items (name+price) with auto tax calc
3. Step 2: Round avatar grid, split equally (default) or custom amounts per person
4. Step 3: Review with editable amounts, line items breakdown, balance verification
5. Optional: scan receipt → assign items to specific people via avatar taps
4. Gets two URLs: public (`/b/[id]`) and admin (`/b/[id]/dashboard?token=xxx`)
5. Shares via WhatsApp. Dashboard has tabs (Unpaid/Paid) + per-person nudge buttons
6. Friends open link → see payment card with split breakdown → confirm payment
7. QR code page (`/b/[id]/qr`) for in-person scanning
8. Confetti on all-paid. Quick-add contacts saved to localStorage.

## Design

- **Theme**: Dutchie-inspired Material Design 3. Indigo primary, mint secondary, tonal surface system.
- **Color**: OKLCH, surface elevation tokens (lowest→highest), primary `oklch(0.48 0.2 280)`
- **Typography**: Inter (next/font), 48px display amounts, 20px numeric data, 12px label caps
- **Surface system**: surface-container-lowest (white) → surface-container-highest (darkest elevation)
- **Landing page**: Two-column hero (desktop), floating bill card mockup, 3-column feature grid, "Why Kongsi" section, footer
- **Home hero card**: Inverted dark bg (slate-900) in light mode, dual-color donut (emerald=paid, amber=remaining), repayment rate badge
- **Anti-patterns avoided**: No AI gradients, no identical card grids, no glassmorphism as default, no bounce animations
- **Components**: ProgressRing (SVG donut, indigo gradient), PaidStamp (success spring seal), ConfettiBurst (indigo/mint/gold), Delete confirmation dialog

## PocketBase Setup

```bash
docker compose up -d pocketbase
# Admin: http://localhost:8098/_/
# Email: admin@kongsi.my / Pass: Kongsi123456!
# Public: https://kongsi-pb.cognitio.my (Cloudflare Tunnel)
```

## Env Vars

| Key | Value |
|---|---|
| NEXT_PUBLIC_PB_URL | https://kongsi-pb.cognitio.my |
| POCKETBASE_ADMIN_EMAIL | admin@kongsi.my |
| POCKETBASE_ADMIN_PASSWORD | Kongsi123456! |
| GROQ_API_KEY | (Wan's key) |
