# BossZap — Sprint Roadmap

## Overview
Development is organized into 6 sprints. Each sprint builds on the previous one.
Follow this order strictly. Do not skip ahead.

---

## Sprint 1: Foundation (Week 1-2)
**Goal:** Project setup, database, basic infrastructure.

### Tasks
1. **Project scaffolding**
   - Initialize monorepo structure (backend, frontend-subscriber, frontend-admin, landing-page).
   - Set up Docker Compose with PostgreSQL and Redis.
   - Configure TypeScript, ESLint, Prettier for all projects.

2. **Backend foundation (NestJS)**
   - Initialize NestJS project with modular structure.
   - Configure TypeORM with PostgreSQL connection.
   - Create all database entities matching `01-DATABASE-SCHEMA.md`.
   - Write and run all migrations.
   - Set up global exception filter, logging (pino), validation pipes.
   - Configure CORS, Helmet, rate limiting.

3. **Authentication module**
   - Subscriber auth: email/password + phone/OTP.
   - Admin auth: email/password.
   - JWT access + refresh token system.
   - Auth guards for subscriber and admin routes.

4. **Frontend foundation**
   - Initialize Next.js App Router for subscriber and admin dashboards.
   - Install and configure Shadcn/ui (all required components from `00-PROJECT-OVERVIEW.md`).
   - Set up Tailwind CSS with design system tokens from `10-UI-UX-DESIGN-SYSTEM.md`.
   - Configure next-intl with es/en/pt-BR translation files.
   - Create base layout: sidebar navigation, responsive shell, language switcher.
   - Set up CSS variables for dark mode readiness.

### Deliverables
- All containers running via `docker-compose up`.
- Database with all tables created.
- Auth endpoints working (register, login, refresh, logout).
- Frontend shell with sidebar, responsive layout, i18n routing.

---

## Sprint 2: WhatsApp + AI Core (Week 3-4)
**Goal:** WhatsApp webhook, message processing, AI orchestrator.

### Tasks
1. **WhatsApp webhook**
   - Implement `POST /api/v1/webhook/whatsapp` with signature verification.
   - Implement `GET` verification challenge endpoint.
   - Message type detection (text, audio, image, document, location).
   - Immediate enqueue to BullMQ and return 200.

2. **Message queue system**
   - Set up BullMQ with Redis.
   - Message processor worker.
   - Retry logic with exponential backoff.
   - Dead letter queue for failed messages.

3. **Media handling**
   - Download media from Meta API (audio, images).
   - Audio: transcribe via Whisper API.
   - Images: validate, resize, store in S3.
   - File URL management.

4. **AI Orchestrator**
   - System prompt engineering (multi-language, intent extraction).
   - Intent classification (all intents from `03-AI-ORCHESTRATOR.md`).
   - Context memory: load last 20 messages.
   - Multi-turn conversation support.
   - Structured data extraction (dates, amounts, names).
   - Error handling and fallback responses.

5. **Onboarding flow**
   - New subscriber detection.
   - Guided conversation: language → business name → owner name → logo → confirm.
   - Logo processing pipeline.
   - Status transition: onboarding → active.

6. **Window tracking**
   - Track 24h window per subscriber.
   - Window check before every outbound message.
   - Pending notification queue system.

### Deliverables
- WhatsApp messages received, processed, and responded to.
- AI understands intents and responds in correct language.
- New users complete onboarding via WhatsApp.
- Window tracking operational.

---

## Sprint 3: Business Modules (Week 5-6)
**Goal:** Agenda, Financial, Budget/PDF modules fully functional.

### Tasks
1. **Agenda module**
   - CRUD operations for events.
   - Natural language event creation via AI.
   - Date/time parsing from conversational input.
   - Event reminder system (P2 priority, window-aware).
   - API endpoints for dashboard.

2. **Financial module**
   - Income/expense registration via AI.
   - Auto-categorization (materials, labor, transport, food, tools, other).
   - Period-based queries (daily, weekly, monthly, yearly).
   - Profit calculation.
   - API endpoints with pagination, filtering, sorting.
   - CSV/Excel export endpoint.

3. **Budget/Quote module**
   - Conversational budget creation via AI.
   - Item collection with quantities and prices.
   - Confirmation flow before generation.
   - PDF generation (following rules in `04-BUSINESS-MODULES.md`).
   - S3 upload and WhatsApp delivery.
   - Auto-numbering (BUD-001, OS-001 per subscriber).
   - Status tracking (draft, sent, accepted, rejected).

4. **Analytics/Query module**
   - Natural language query handling.
   - Data aggregation functions.
   - Response formatting in subscriber's language.

5. **Usage tracking**
   - Count messages, budgets, AI calls per subscriber per month.
   - Enforce plan limits.
   - Friendly limit-reached messages.

### Deliverables
- All business modules functional via WhatsApp.
- PDFs generated with subscriber branding.
- Usage limits enforced.
- All API endpoints ready for dashboards.

---

## Sprint 4: Subscriber Dashboard (Week 7-8)
**Goal:** Full subscriber web dashboard with real-time sync.

### Tasks
1. **Dashboard home page**
   - Summary cards (revenue, expenses, profit, events).
   - Revenue vs expenses area chart (last 6 months).
   - Upcoming events list.
   - Recent transactions.
   - Quick action buttons.
   - Mobile: FAB, 2x2 grid cards, swipeable charts.

2. **Financial page**
   - Period selector with custom date range.
   - Revenue trend line chart.
   - Expense category donut chart.
   - Daily profit bar chart.
   - Filterable, sortable transaction table.
   - CSV/Excel export.
   - Mobile: scrollable pills, card layout, pull-to-refresh.

3. **Calendar page**
   - Monthly calendar with event indicators.
   - Event detail side panel.
   - Color-coded statuses.
   - Mobile: week view default, bottom sheet details, swipe navigation.

4. **Documents page**
   - PDF list with filters.
   - Preview and download.
   - Status badges.
   - Mobile: card layout, long-press actions.

5. **Profile page**
   - Business info editing.
   - Logo upload.
   - Subscription details.
   - Language preference.
   - Payment history.

6. **Real-time sync (WebSocket)**
   - Socket.io connection.
   - Push updates for new records, events, documents.
   - Auto-reconnect on disconnect.

### Deliverables
- Full subscriber dashboard, mobile-responsive.
- Real-time updates from WhatsApp activity.
- All pages functional with real data.

---

## Sprint 5: Admin Dashboard + Payments (Week 9-10)
**Goal:** Admin panel, payment integration, access control.

### Tasks
1. **Admin overview page**
   - Subscriber count cards.
   - Growth and revenue trend charts.
   - Alert panel.

2. **Subscriber management**
   - Searchable, filterable subscriber table.
   - Detail view with usage, payments, conversations.
   - Activate/deactivate/suspend actions.

3. **Payment integration (Stripe)**
   - Stripe checkout session creation.
   - Webhook handler (payment_success, failed, cancelled, renewed).
   - Subscription lifecycle management.
   - Trial period handling.

4. **Payment recovery**
   - Automated reminder sequence (Day 0, 2, 3).
   - Window-aware message sending.
   - HSM template fallback for P1 recovery messages.
   - Grace period → suspension flow.

5. **Plan management**
   - CRUD for plans.
   - Limit configuration.
   - Subscriber limit monitoring.

6. **Admin metrics & logs**
   - Usage metrics page (global + per subscriber).
   - System logs viewer with search/filter.
   - System health dashboard (queues, workers, APIs).

7. **HSM template management**
   - Template CRUD.
   - Approval status tracking.
   - Test sending.

### Deliverables
- Full admin dashboard.
- Stripe payments working (card + Pix).
- Automated recovery flow.
- Plan limits enforced and manageable.

---

## Sprint 6: Landing Page + Polish + Deploy (Week 11-12)
**Goal:** Landing page, production deployment, final polish.

### Tasks
1. **Landing page**
   - Hero section with CTA.
   - Features section.
   - How it works (3-step).
   - Pricing section.
   - Language switcher.
   - Framer Motion scroll animations.
   - Lighthouse 90+ score.
   - Mobile-first responsive design.

2. **Registration flow**
   - Sign-up form on landing page.
   - Plan selection.
   - Stripe checkout integration.
   - Welcome email.
   - Redirect to dashboard.

3. **Production deployment**
   - Finalize Dockerfiles (multi-stage, production-optimized).
   - Set up CI/CD pipelines (staging + production).
   - Configure cloud infrastructure.
   - SSL certificates.
   - CDN for static assets.
   - Database backup automation.

4. **Monitoring & alerting**
   - Health check endpoints.
   - Centralized logging.
   - Error alerting.
   - Uptime monitoring.

5. **Final polish**
   - Cross-browser testing.
   - Mobile testing at all breakpoints (375px, 414px, 768px, 1024px, 1440px).
   - Accessibility audit.
   - Performance optimization (bundle splitting, lazy loading).
   - Complete all translation files (es, en, pt-BR).
   - Review all error messages and edge cases.

### Deliverables
- Landing page live and converting.
- Full platform deployed to production.
- Monitoring and alerting active.
- All features tested and polished.

---

## Post-Launch
- Monitor error rates and performance.
- Gather subscriber feedback via WhatsApp.
- Iterate on AI prompt quality.
- Plan dark mode implementation.
- Evaluate additional modules (CRM, inventory, etc.).
