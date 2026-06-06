# Project Goalie — Subscription Management App

> Stop paying for subscriptions you don't use. Align your spending with your goals.

A full-stack Next.js 14 application featuring AI-powered goal alignment, usage scanning, budget tracking, and smart renewal reminders.

---

## Features

| Feature | Description |
|---|---|
| **Subscription Reminders** | Tracks renewal dates and fires push/in-app notifications 3–7 days before renewal |
| **Budgeting** | Set a monthly limit, visualize spending by category, get alerts at configurable thresholds |
| **Usage Scanner** | Monthly survey identifies rarely-used subs with one-click cancel recommendations |
| **Goal Alignment (AI)** | GPT-4o-mini analyzes each subscription against your goals and scores Keep/Review/Cancel |

---

## Tech Stack

- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (edge-ready)
- **Database**: PostgreSQL via [Supabase](https://supabase.com)
- **ORM**: Prisma
- **Auth**: NextAuth v5 (credentials + Google OAuth)
- **AI**: OpenAI GPT-4o-mini via LangChain-compatible prompt pipelines
- **Hosting**: Vercel (frontend + cron), Supabase (DB + auth sessions)

---

## Project Structure

```
project-goalie/
├── app/
│   ├── page.tsx                    # Root redirect
│   ├── layout.tsx                  # Root layout (fonts, toaster)
│   ├── globals.css                 # Design tokens + Tailwind base
│   ├── auth/login/page.tsx         # Login page
│   ├── dashboard/
│   │   ├── layout.tsx              # Auth-guarded layout with sidebar
│   │   └── page.tsx                # Dashboard with stats + charts
│   ├── subscriptions/page.tsx      # Subscription list + CRUD
│   ├── budgeting/page.tsx          # Budget gauge + breakdown
│   ├── goals/page.tsx              # Goals list + AI alignment panel
│   ├── scanning/page.tsx           # Usage survey + rarely-used alerts
│   └── api/
│       ├── auth/[...nextauth]/     # NextAuth handler
│       ├── subscriptions/          # GET, POST, PATCH, DELETE
│       ├── budget/                 # GET, PUT
│       ├── goals/                  # GET, POST + /alignment (AI)
│       ├── scanning/               # GET, POST (survey)
│       ├── notifications/          # GET, PATCH (mark read)
│       └── cron/daily/             # Scheduled renewal + budget checks
├── components/
│   ├── layout/Sidebar.tsx
│   ├── dashboard/                  # StatsCard, AlertsBanner, UpcomingRenewals
│   ├── subscriptions/              # SubscriptionsList, SubscriptionForm, dialogs
│   ├── budget/BudgetManager.tsx
│   ├── goals/                      # GoalsList, GoalAlignmentPanel
│   ├── scanning/                   # UsageSurvey, RarelyUsedList
│   └── charts/SpendingChart.tsx
├── lib/
│   ├── prisma.ts                   # Prisma singleton
│   ├── auth.ts                     # NextAuth config
│   ├── utils.ts                    # Helpers (toMonthly, formatCurrency, etc.)
│   ├── llm.ts                      # OpenAI goal alignment
│   └── notifications.ts            # Renewal + budget alert scheduling
├── types/index.ts                  # Shared TypeScript types
├── prisma/schema.prisma            # Full DB schema
├── tailwind.config.ts
├── next.config.js
├── vercel.json                     # Vercel cron config
└── .env.example                    # Required environment variables
```

---

## Getting Started

### 1. Clone & install

```bash
git clone <your-repo>
cd project-goalie
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in each value in `.env.local`:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` for dev |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `CRON_SECRET` | Any random string (protects your cron endpoint) |

### 3. Set up the database

```bash
# Push schema to your Supabase PostgreSQL
npm run db:push

# Or run migrations (recommended for production)
npm run db:migrate
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

---

## Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable the **Google+ API** / **People API**
4. Go to **Credentials → Create Credentials → OAuth Client ID**
5. Application type: **Web application**
6. Add Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://yourdomain.com/api/auth/callback/google` (prod)
7. Copy Client ID and Secret to `.env.local`

---

## Database Schema

Key tables:

- **users** — Auth, preferences
- **subscriptions** — Core data: name, cost, billing cycle, renewal date, category, usage level
- **budget** — Per-user monthly limit and alert threshold
- **goals** — User goals with category (Career, Education, Health, etc.)
- **notifications** — Renewal reminders, budget alerts, rarely-used flags
- **surveys** + **survey_entries** — Monthly usage tracking per subscription

---

## Deploying to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard or:
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
# ... etc
```

The `vercel.json` configures a daily cron job at 8am UTC that:
- Schedules renewal reminder notifications
- Checks if any user is at/over their budget threshold

---

## Adding a User (Dev)

Since there's no registration page yet, you can either:

**Option A — Use Google OAuth** (easiest, no password needed)

**Option B — Insert directly via Prisma Studio**

```bash
npm run db:studio
```

Then create a user with a bcrypt-hashed password:

```js
// Generate hash in Node:
const bcrypt = require('bcryptjs');
console.log(await bcrypt.hash('yourpassword', 12));
```

---

## Roadmap / Next Steps

- [ ] Registration page (`/auth/register`)
- [ ] Email notifications via Resend or SendGrid
- [ ] Mobile app usage tracking (iOS/Android APIs)
- [ ] CSV import for bulk subscription upload
- [ ] Settings page (account, notification preferences)
- [ ] Dark/light theme toggle
- [ ] Stripe integration for premium tier

---

## Design System

The app uses a **deep navy + electric lime** palette defined entirely in CSS variables:

| Token | Value | Use |
|---|---|---|
| `--color-surface` | `#0f1117` | Page background |
| `--color-surface-2` | `#191d27` | Cards |
| `--color-surface-3` | `#222736` | Inputs, rows |
| `--color-accent` | `#c8f135` | Primary actions, highlights |
| `--color-ink` | `#e8ecf4` | Primary text |
| `--color-muted` | `#7a8299` | Secondary text |

Fonts: **DM Sans** (UI) + **DM Mono** (numbers/code)
