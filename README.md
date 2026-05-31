# 🧾 Kongsi — Split Bills, Zero Drama

The easiest way to split bills with friends. Snap a receipt, assign who ate what, and track who's paid — no accounts, no fuss.

**🔗 Live:** [kongsi.cognitio.my](https://kongsi.cognitio.my)

---

## 📖 Usage Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        🧾 KONGSI WORKFLOW                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────┐  │
│  │  CREATE  │───▶│  SPLIT   │───▶│  SHARE   │───▶│    TRACK     │  │
│  │  bill    │    │  items   │    │  links   │    │  payments    │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────────┘  │
│       │              │               │                  │           │
│       ▼              ▼               ▼                  ▼           │
│  📸 Scan or     👥 Assign     🔗 WhatsApp      📊 Dashboard         │
│  manual entry   per person    personal URL     live updates         │
│                                per friend      approve proofs       │
│                                                                     │
│  ───────────────────────────────────────────────────────────────    │
│  💡 TYPICAL FLOW:                                                   │
│                                                                     │
│  You pay the bill  →  Create in Kongsi  →  Share with friends      │
│                                          →  Friends see their share │
│                                          →  They pay + upload proof │
│                                          →  You approve  →  🎉      │
└─────────────────────────────────────────────────────────────────────┘
```

### Step by Step

| # | Action | Who |
|---|--------|-----|
| 1 | 📸 **Scan receipt** or enter manually — AI extracts line items | You (organizer) |
| 2 | 👥 **Assign items** to friends — tap avatars per dish | You |
| 3 | 🔗 **Share links** — each friend gets their personal payment URL | You → Friends |
| 4 | 💰 **Friends pay** — see their breakdown, pay, upload proof | Friends |
| 5 | ✅ **You approve** — verify proof, mark as paid | You |
| 6 | 🎉 **All settled!** — confetti burst when everyone's done | Everyone |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        🏗️ SYSTEM ARCHITECTURE                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────┐      ┌─────────────┐      ┌──────────────────┐   │
│   │  🖥️ Next.js  │◀────▶│ 🗄️ PocketBase│◀────▶│ 🤖 Groq AI       │   │
│   │  (Vercel)   │      │  (Docker)   │      │ (Receipt OCR)    │   │
│   └──────┬──────┘      └──────┬──────┘      └──────────────────┘   │
│          │                    │                                      │
│          ▼                    ▼                                      │
│   ┌──────────────┐    ┌──────────────┐                              │
│   │ 🎨 Client UI │    │ ☁️ Cloudflare │                              │
│   │ Tailwind v4  │    │   Tunnel     │                              │
│   │ Framer Motion│    │ (PB public)  │                              │
│   │ shadcn/ui    │    └──────────────┘                              │
│   └──────────────┘                                                  │
│                                                                      │
│   ───────────────────────────────────────────────────────────────   │
│   🔐 SECURITY LAYER                                                  │
│                                                                      │
│   Admin Token ──▶ DELETE bill                                       │
│   Payment Token ──▶ Personal pay page                                │
│   Rate Limit ──▶ 10 req/min (create), 5/15min (pay)                 │
│   Headers ──▶ HSTS, X-Content-Type, X-Frame, X-XSS                  │
└──────────────────────────────────────────────────────────────────────┘
```

### Request Flow

```
  👤 Friend                    🌐 Next.js API                 🗄️ PocketBase
  ─────────                   ─────────────                 ─────────────
      │                             │                             │
      │  GET /b/[id]                │                             │
      │────────────────────────────▶│                             │
      │                             │  GET kongsi_bills/[id]      │
      │                             │────────────────────────────▶│
      │                             │  ◀─────────────────────────│
      │  ◀──────────────────────────│                             │
      │                             │                             │
      │  POST /b/[id]/pay           │                             │
      │────────────────────────────▶│                             │
      │                             │  PATCH participant          │
      │                             │────────────────────────────▶│
      │                             │  ◀─────────────────────────│
      │  ◀──────────────────────────│                             │
      │                             │                             │
  👤 Admin (Organizer)              │                             │
  ────────────────                  │                             │
      │                             │                             │
      │  GET /dashboard?token=xxx   │                             │
      │────────────────────────────▶│                             │
      │                       🔐 verify token                     │
      │                             │  GET + filter               │
      │                             │────────────────────────────▶│
      │  ◀──────────────────────────│                             │
      │                             │                             │
      │  DELETE /b/[id]             │                             │
      │────────────────────────────▶│                             │
      │                       🔐 verify token                     │
      │                             │  DELETE bill (cascade)      │
      │                             │────────────────────────────▶│
      │  ◀──────────────────────────│                             │
```

---

## 🗃️ Data Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                      🗃️ POCKETBASE COLLECTIONS                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────┐  ┌──────────────────────────────┐│
│  │       kongsi_bills           │  │    kongsi_participants        ││
│  ├───────────────────────────────┤  ├──────────────────────────────┤│
│  │ id           text (PK)       │  │ id           text (PK)       ││
│  │ title        text            │  │ bill_id      relation ───────┼┼──┐
│  │ total_amount number          │  │ name         text            ││  │
│  │ description  text            │  │ amount       number          ││  │
│  │ due_date     date            │  │ paid         bool            ││  │
│  │ admin_token  text 🔐         │  │ paid_at      date            ││  │
│  │ admin_qr     text (500K)     │  │ status       text            ││  │
│  │ line_items   text (500K)     │  │ payment_token text 🔐        ││  │
│  └───────────────────────────────┘  │ proof_image  text (500K)     ││  │
│                                      └──────────────────────────────┘│  │
│  ┌─────────────────────────────────────────────────────────────────┘  │
│  │                                                                    │
│  │  🔗 CASCADE DELETE: Deleting a bill removes all its participants   │
│  └────────────────────────────────────────────────────────────────────│
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                    line_items (JSON)                             │ │
│  ├──────────────────────────────────────────────────────────────────┤ │
│  │  [                                                               │ │
│  │    { "name": "Nasi Goreng",   "amount": 12.50, "paidBy": [...] },│ │
│  │    { "name": "Teh Tarik",     "amount":  3.00, "paidBy": [...] },│ │
│  │    { "name": "Roti Canai",    "amount":  2.50, "paidBy": [...] },│ │
│  │    { "name": "Tax (SST 6%)",  "amount":  1.08, "paidBy":  null } │ │
│  │  ]                                                               │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 AI Receipt Scanner

```
┌─────────────────────────────────────────────────────────────────────┐
│                   🤖 2-TIER RECEIPT SCANNING PIPELINE                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📸 User uploads                                                    │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────────┐                       │
│  │  TIER 1: Scout Vision (Llama 4)          │                       │
│  │  ─────────────────────────────────────── │                       │
│  │  • Checks: "Is this a receipt?"          │                       │
│  │  • Extracts: raw text from image         │                       │
│  │  • Decision: receipt → Tier 2            │                       │
│  │             not receipt → ❌ redirect     │                       │
│  └─────────────────┬───────────────────────┘                       │
│                    │                                               │
│                    ▼                                               │
│  ┌─────────────────────────────────────────┐                       │
│  │  TIER 2: GPT-OSS 120B                     │                       │
│  │  ─────────────────────────────────────── │                       │
│  │  • Structures: raw text → line items      │                       │
│  │  • Detects: subtotal vs total gap         │                       │
│  │  • Calculates: tax % auto                  │                       │
│  │  • Output: [{name, amount}, ...]          │                       │
│  └─────────────────┬───────────────────────┘                       │
│                    │                                               │
│                    ▼                                               │
│  ┌─────────────────────────────────────────┐                       │
│  │  UI: Assign items to friends              │                       │
│  └─────────────────────────────────────────┘                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛣️ Routes & API

```
┌─────────────────────────────────────────────────────────────────────┐
│                        🛣️ APPLICATION ROUTES                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  /                    🏠 Landing page (hero + features)             │
│  /app                 📱 App home (quick actions + active bills)    │
│  /app/create          ➕ 3-step bill creation wizard                 │
│  /app/scan            📸 Receipt scanner + manual entry mode        │
│  /app/history         🕐 Past bills (localStorage)                  │
│  /b/[id]              💳 Public payment card                        │
│  /b/[id]/dashboard    📊 Organizer dashboard (🔐 token-gated)       │
│  /b/[id]/qr           📱 QR payment page                           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                        ⚡ API ENDPOINTS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  POST   /api/bills                    📝 Create bill + participants │
│  GET    /api/bills/[id]               📋 Public bill data           │
│  POST   /api/bills/[id]/pay           💰 Submit payment + proof     │
│  GET    /api/bills/[id]/dashboard     📊 Dashboard data (🔐)        │
│  DELETE /api/bills/[id]               🗑️  Delete bill + cascade (🔐) │
│  POST   /api/scan-receipt             🤖 Receipt OCR + structuring  │
│  POST   /api/bills/[id]/qr            📱 Upload admin QR code       │
│  POST   /api/bills/[id]/approve       ✅ Approve payment proof      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Security

```
┌─────────────────────────────────────────────────────────────────────┐
│                        🛡️ SECURITY MEASURES                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  🔐 TOKEN AUTH                                                      │
│     • Admin token: crypto.randomUUID() (not Math.random)            │
│     • Payment token: 24-char random string per participant          │
│     • DELETE + dashboard gated behind admin token verification      │
│                                                                     │
│  ⏱️ RATE LIMITING                                                    │
│     • Create bill: 10 requests per minute per IP                    │
│     • Submit payment: 5 requests per 15 minutes per IP              │
│                                                                     │
│  🖼️ PROOF VALIDATION                                                │
│     • Image-only uploads (type checking)                            │
│     • Size limits enforced                                          │
│                                                                     │
│  🛡️ SECURITY HEADERS                                                │
│     • Strict-Transport-Security (HSTS)                              │
│     • X-Content-Type-Options: nosniff                               │
│     • X-Frame-Options: DENY                                         │
│     • X-XSS-Protection                                              │
│                                                                     │
│  🔒 NO ACCOUNT SYSTEM                                                │
│     • Dashboard access via unique token in URL (not guessable)      │
│     • Contacts stored locally (localStorage)                        │
│     • No user registration, no passwords to leak                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| 🖥️ Framework | Next.js 16 (App Router, TypeScript strict) |
| 🎨 Styling | Tailwind CSS v4 (OKLCH), shadcn/ui |
| 🔤 Typography | Inter (next/font/google) |
| 🎬 Animation | Framer Motion |
| 🧩 Icons | Lucide React |
| ✅ Validation | Zod |
| 🗄️ Backend | PocketBase (Docker, Cloudflare Tunnel) |
| 🤖 AI/ML | Groq — Llama 4 Scout + GPT-OSS 120B |
| 🚀 Deploy | Vercel (auto-deploy on push) |

---

## 🚀 Getting Started

```bash
git clone <repo-url> && cd kongsi
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_PB_URL=your-pocketbase-url
POCKETBASE_ADMIN_EMAIL=your-admin-email
POCKETBASE_ADMIN_PASSWORD=your-admin-password
GROQ_API_KEY=your-groq-api-key
```

```bash
# PocketBase (local via Docker)
docker compose up -d pocketbase

# Dev server
npm run dev
# → http://localhost:3000
```

---

## 📦 Key Features

- 📸 **AI receipt scanner** — 2-tier pipeline, snap and done
- 👥 **Per-item assignment** — who ordered the extra nasi goreng? we know
- 🔗 **Personal payment links** — each friend sees only their share
- 📊 **Live dashboard** — unpaid/paid tabs, one-tap nudge reminders
- 📱 **QR payment** — upload QR, friends scan to pay
- ✅ **Proof + approval flow** — upload proof → approve → 🎉 confetti
- 🧮 **Auto tax calculation** — detects subtotal/total gap, calculates %
- 🌓 **Dark mode** — full light/dark with theme persistence
- 💨 **Skeleton loading** — shimmer placeholders on every page
- ⚠️ **Error boundaries** — retry buttons on every failure state
- 🔴 **Past-due indicators** — red accent on overdue unpaid bills
- 💾 **Local contact book** — saved to localStorage, zero server accounts

---

## 📄 License

MIT
