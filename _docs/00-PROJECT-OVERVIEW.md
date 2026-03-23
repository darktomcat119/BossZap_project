# BossZap — Project Overview

## Project Identity
- **Project Name:** BossZap
- **Type:** SaaS (Software as a Service)
- **Target Users:** Brazilian MEIs (Microempreendedores Individuais) — small business owners (painters, electricians, plumbers, etc.)
- **Core Concept:** AI-powered virtual assistant that manages a subscriber's entire business (schedule, finances, quotes) through WhatsApp conversations — text and audio.
- **Scale Target:** 10,000+ active subscribers on a single WhatsApp number.

## Multi-Language Support
- **Spanish (es):** DEFAULT language. All UI, landing page, system defaults.
- **English (en):** Full translation.
- **Brazilian Portuguese (pt-BR):** Full translation.
- The AI responds in the subscriber's preferred language (stored in profile).

## System Pillars
1. **WhatsApp Interface** — Single WABA number for all subscribers. Text + audio.
2. **AI Orchestrator** — Intent classification, routing, context memory.
3. **Business Modules** — Agenda, Financial, Budgets/PDFs, Service Orders, Analytics.
4. **Web Dashboards** — Subscriber panel + Master Admin panel, real-time sync.
5. **Payments & Monetization** — Landing page, Stripe/Pagar.me, automated access.
6. **Infrastructure** — Cloud, CI/CD, backups, security, monitoring.

## Technical Stack
| Layer | Technology |
|---|---|
| Backend | Node.js (TypeScript) with NestJS |
| Database | PostgreSQL (primary), Redis (cache + queues) |
| Message Queue | Redis (BullMQ) or RabbitMQ |
| AI / LLM | OpenAI GPT-4 API |
| Audio Processing | OpenAI Whisper API |
| Frontend | React with Next.js (App Router) |
| UI Components | Shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Charts | Recharts |
| Animations | Framer Motion |
| i18n | next-intl |
| Real-time | WebSocket (Socket.io) |
| PDF Generation | Puppeteer or PDFKit |
| File Storage | AWS S3 |
| Payment Gateway | Stripe or Pagar.me (Pix + credit card) |
| WhatsApp | Meta WhatsApp Cloud API (WABA) — official only |
| Hosting | AWS, GCP, Railway, or Render |
| CI/CD | GitHub Actions |
| Containerization | Docker + Docker Compose |

## Architecture Rules

### Multi-Tenant Model
- Single database, tenant isolation by `subscriber_id` on every table.
- Every query MUST filter by `subscriber_id`.
- `subscriber_id` derived from sender's phone number on incoming WhatsApp messages.

### Single WABA Number
- ALL subscribers use ONE official Meta WhatsApp number.
- Backend identifies each subscriber by phone number (`from` field in webhook).
- Must handle Meta's rate limits for the single number.

### Async Processing (CRITICAL)
- ALL incoming WhatsApp messages go through a message queue before processing.
- Flow: Webhook → Enqueue → Worker → AI → Response
- Workers must be horizontally scalable.

### Clean Architecture
- Controllers → Services → Repositories → Database
- Business logic NEVER in controllers.
- Each business module is an independent service.

## Frontend Library Rules

### Shadcn/ui
- NOT an npm import — copies source code into `src/components/ui/`.
- Install via CLI: `npx shadcn@latest add button dialog table` etc.
- Do NOT install MUI, Ant Design, Chakra, or any other UI library.
- Required components: button, input, label, select, dialog, dropdown-menu, table, card, badge, toast (sonner), tabs, separator, avatar, calendar, popover, command, sheet, skeleton, tooltip, switch, checkbox, radio-group, textarea, alert, progress.

### Tailwind CSS
- Design tokens in `tailwind.config.ts` (colors, fonts, spacing).
- CSS variables for future dark mode.
- Never inline styles. Never raw CSS files. Tailwind classes only.
- Exception: `globals.css` for font imports and CSS variable definitions.

### Recharts
- Only chart library. Area, bar, line, donut charts.
- Always wrap in `ResponsiveContainer`.
- Always include Tooltip, Legend, axis labels.

### Framer Motion
- Landing page scroll animations, page transitions, modal animations.
- Intentional and subtle. Do NOT animate every element.

### Lucide React
- size={20} for nav/buttons, size={16} inline, size={24} feature cards.
- Never use emoji or unicode as icons.

## Project Folder Structure
```
bosszap/
├── _docs/                          (project documentation — generated first)
├── docker-compose.yml
├── .github/workflows/
│   ├── deploy-staging.yml
│   └── deploy-production.yml
├── backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── main.ts
│   │   ├── config/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── whatsapp/
│   │   │   │   ├── webhook.controller.ts
│   │   │   │   ├── whatsapp.service.ts
│   │   │   │   ├── media.service.ts
│   │   │   │   └── window-tracker.service.ts
│   │   │   ├── ai/
│   │   │   │   ├── orchestrator.service.ts
│   │   │   │   ├── intent-classifier.service.ts
│   │   │   │   ├── onboarding.service.ts
│   │   │   │   └── prompts/
│   │   │   ├── agenda/
│   │   │   ├── financial/
│   │   │   ├── budget/
│   │   │   │   ├── budget.service.ts
│   │   │   │   └── pdf-generator.service.ts
│   │   │   ├── analytics/
│   │   │   ├── subscribers/
│   │   │   ├── payments/
│   │   │   │   ├── payment.service.ts
│   │   │   │   ├── stripe.service.ts
│   │   │   │   └── recovery.service.ts
│   │   │   ├── notifications/
│   │   │   │   ├── notification-queue.service.ts
│   │   │   │   └── window-optimizer.service.ts
│   │   │   └── admin/
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   └── entities/
│   │   ├── queue/
│   │   │   ├── processors/
│   │   │   └── jobs/
│   │   └── common/
│   │       ├── guards/
│   │       ├── interceptors/
│   │       ├── constants/
│   │       └── utils/
│   └── test/
├── frontend-subscriber/
│   ├── Dockerfile
│   ├── src/
│   │   ├── messages/
│   │   │   ├── es.json
│   │   │   ├── en.json
│   │   │   └── pt-BR.json
│   │   ├── app/
│   │   │   └── [locale]/
│   │   │       ├── dashboard/
│   │   │       ├── financial/
│   │   │       ├── calendar/
│   │   │       ├── documents/
│   │   │       └── profile/
│   │   ├── components/
│   │   │   ├── ui/          (shadcn components)
│   │   │   ├── charts/
│   │   │   ├── layout/
│   │   │   └── shared/
│   │   ├── lib/
│   │   ├── hooks/
│   │   └── services/
│   └── public/
├── frontend-admin/
│   ├── Dockerfile
│   ├── src/
│   │   ├── messages/
│   │   │   ├── es.json
│   │   │   ├── en.json
│   │   │   └── pt-BR.json
│   │   ├── app/
│   │   │   └── [locale]/
│   │   │       ├── overview/
│   │   │       ├── subscribers/
│   │   │       ├── payments/
│   │   │       ├── plans/
│   │   │       ├── metrics/
│   │   │       └── logs/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── hooks/
│   │   └── services/
│   └── public/
├── landing-page/
│   ├── Dockerfile
│   └── src/
└── docs/
    ├── api/            (Swagger/OpenAPI output)
    └── admin-manual/   (operation manual, per language)
```

## Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/bosszap
REDIS_URL=redis://host:6379

# Meta WhatsApp
WABA_PHONE_NUMBER_ID=xxxxx
WABA_ACCESS_TOKEN=xxxxx
WABA_VERIFY_TOKEN=xxxxx
WABA_APP_SECRET=xxxxx

# OpenAI
OPENAI_API_KEY=xxxxx

# AWS S3
AWS_S3_BUCKET=bosszap-files
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_REGION=sa-east-1

# Payment Gateway
STRIPE_SECRET_KEY=xxxxx
STRIPE_WEBHOOK_SECRET=xxxxx

# JWT
JWT_SECRET=xxxxx
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# App
APP_URL=https://app.bosszap.com
ADMIN_URL=https://admin.bosszap.com
LANDING_URL=https://bosszap.com
DEFAULT_LANGUAGE=es
```
