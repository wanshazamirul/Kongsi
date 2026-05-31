# Kongsi — Split Bills, Zero Drama

A beautiful split-bill tracker built for kopitiam crews. Create a bill, scan a receipt, assign items to people, and track who's paid — all with a Dutchie-inspired Material Design 3 interface.

**Live:** [kongsi.cognitio.my](https://kongsi.cognitio.my)

## Why Kongsi?

Splitting bills after a group meal is chaos. Someone fronts the bill, then spends days chasing payments on WhatsApp. Receipts get lost. "Who ordered the teh tarik?" becomes a mystery.

Kongsi fixes this:
- One person creates the bill, adds participants, and shares a link
- Friends see exactly what they owe and pay through the app
- The organizer tracks everyone's status on a live dashboard
- Receipt scanning with AI line-item extraction (no manual typing)

## Features

### Core Flow
- **3-step bill creation wizard** — details + line items → participants → review
- **Smart split** — equal split by default, custom amounts per person, toggle yourself in/out
- **Line-item assignment** — who ordered what, auto-calculates proportional tax
- **Shareable payment links** — each friend gets a personal pay page with their exact breakdown
- **Live organizer dashboard** — tabs (Unpaid/Paid), per-person nudge reminders, confetti on full settlement

### AI Receipt Scanner
- **2-tier pipeline** — Llama 4 Scout (vision) extracts raw text → GPT-OSS 120B structures line items
- **Non-receipt detection** — redirects users back if they upload something that isn't a receipt
- **Auto tax calculation** — detects gap between subtotal and total, calculates tax percentage
- **Split-item support** — handles receipts where single line items are shared across people

### Payment Flow
- **QR payment** — organizer uploads payment QR, friends scan to pay
- **Proof upload** — friends submit payment proof after transferring
- **Admin approval** — organizer approves/rejects payment proofs
- **Remind button** — one-tap nudge with personalized WhatsApp share text

### UX Polish
- **Dutchie-inspired Material Design 3** — indigo primary, tonal surface elevation, Inter typeface
- **Progress rings** — SVG donut charts showing paid vs remaining per person
- **Paid stamp** — spring-animated "PAID" seal on settled bills
- **Confetti burst** — celebration animation when all participants have paid
- **Skeleton loading** — shimmer placeholders on all data-driven pages
- **Error states** — retry buttons on every failure boundary
- **Dark mode** — full light/dark support with OKLCH color space
- **Past-due indicators** — red accent + "Overdue" badge on late unpaid bills
- **Theme persistence** — inline script in layout head, no flash of wrong theme

### Data & Privacy
- **No accounts required** — dashboard access via unique admin token in URL
- **Local contact book** — saved to localStorage, no server-side user accounts
- **PB admin credential scoping** — defense-in-depth with restricted collection rules

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript strict) |
| Styling | Tailwind CSS v4 (OKLCH), shadcn/ui |
| Typography | Inter (next/font/google) |
| Animation | Framer Motion |
| Icons | Lucide React |
| Validation | Zod |
| Backend | PocketBase (Docker, Cloudflare Tunnel) |
| AI/ML | Groq (Llama 4 Scout Vision + GPT-OSS 120B) |
| Deployment | Vercel (auto-deploy on push) |

## Architecture

```
Organizer creates bill → Kongsi generates 2 URLs
                            │
                    ┌───────┴───────┐
                    ▼               ▼
            Public pay page    Admin dashboard
            /b/[id]            /b/[id]/dashboard?token=xxx
                    │               │
                    ▼               ▼
            Friends pay         Organizer tracks
            + upload proof      + approves/rejects
                                    │
                                    ▼
                            All paid → confetti 🎉
```

### Routes

| Route | Purpose |
|---|---|
| `/` | Landing page — hero, features grid, "Why Kongsi" |
| `/app` | App home — quick actions, active bills list |
| `/app/create` | 3-step bill creation wizard |
| `/app/scan` | Receipt scanner + manual entry mode |
| `/app/history` | Past bills from localStorage |
| `/b/[id]` | Public payment card (Dutchie-style) |
| `/b/[id]/dashboard` | Organizer dashboard (token-gated) |
| `/b/[id]/qr` | QR payment page for in-person scanning |

### API Routes

| Route | Purpose | Auth |
|---|---|---|
| `POST /api/bills` | Create bill + participants | None |
| `GET /api/bills/[id]` | Public bill data | None |
| `POST /api/bills/[id]/pay` | Submit payment + proof | None |
| `GET /api/bills/[id]/dashboard` | Dashboard data | Token |
| `DELETE /api/bills/[id]` | Delete bill (cascade) | Token |
| `POST /api/scan-receipt` | Receipt OCR + structuring | None |

### Data Model

**kongsi_bills** — `id`, `title`, `total_amount`, `description`, `due_date`, `admin_token`, `admin_qr`, `line_items`

**kongsi_participants** — `id`, `bill_id` (relation), `name`, `amount`, `paid`, `paid_at`

## Getting Started

```bash
# Clone
git clone <repo-url> && cd kongsi

# Install
npm install

# Environment variables (.env.local)
NEXT_PUBLIC_PB_URL=https://kongsi-pb.cognitio.my
POCKETBASE_ADMIN_EMAIL=your-admin-email
POCKETBASE_ADMIN_PASSWORD=your-admin-password
GROQ_API_KEY=your-groq-api-key

# Run
npm run dev
# → http://localhost:3000
```

### PocketBase (local)

```bash
docker compose up -d pocketbase
# Admin: http://localhost:8098/_/
```

## Security

- **DELETE endpoint** — requires valid `admin_token` to prevent unauthorized deletion
- **Crypto-secure tokens** — `crypto.randomUUID()` for admin tokens (not Math.random)
- **Rate limiting** — pay endpoint throttled to 5 requests/15min per IP
- **Proof validation** — image-only uploads, size limits, type checking
- **Security headers** — Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection

## License

MIT
