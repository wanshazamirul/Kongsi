# Kongsi — Architecture

Split bill payment tracker. Malaysian kopitiam-themed. KrackedDevs bounty (RM 500, deadline June 1, 2026).

## Stack

- **Framework**: Next.js 16 (App Router, TypeScript strict)
- **Styling**: Tailwind CSS v4 (OKLCH), shadcn/ui
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
| `/` | Landing + recent bills (localStorage) | None |
| `/create` | Manual bill creation form | None |
| `/scan` | Receipt scanner (camera → Groq Vision → auto-fill) | None |
| `/history` | Past bills from localStorage | None |
| `/b/[id]` | Public bill page (members pay) | None |
| `/b/[id]/dashboard?token=xxx` | Organizer dashboard | Token |
| `POST /api/bills` | Create bill + participants | None |
| `GET /api/bills/[id]` | Public bill data | None |
| `POST /api/bills/[id]/pay` | Confirm payment (mock) | None |
| `GET /api/bills/[id]/dashboard?token=xxx` | Dashboard data | Token |
| `POST /api/scan-receipt` | Groq Vision receipt OCR | None |

## Flow

1. Organizer scans receipt or enters manually → creates bill with participants
2. Gets two URLs: public (`/b/[id]`) and admin (`/b/[id]/dashboard?token=xxx`)
3. Shares public link via WhatsApp
4. Friends open link → tap "Pay" per participant → mock payment confirmed
5. Organizer dashboard tracks progress in real-time

## Design

- **Theme**: Kopitiam/warung aesthetic. Light mode default (bright mamak). Amber accents.
- **Color**: OKLCH, warm whites tinted toward amber, restained accent usage
- **Anti-patterns avoided**: No AI gradients, no identical card grids, no glassmorphism, no dark-default
- **Components**: PaidStamp (spring animation), ProgressKopi (coffee cup fill), ConfettiBurst

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
