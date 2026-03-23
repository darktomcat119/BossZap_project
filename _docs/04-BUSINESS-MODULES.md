# BossZap — Business Modules

## Module 1: Agenda Service

### Features
- Create events from natural language via AI.
- Query events by date, date range, or upcoming.
- Update event time/date/location.
- Cancel events.
- Dashboard: calendar view with color-coded statuses.

### Status Colors
- Scheduled: blue
- Completed: green
- Cancelled: gray

### Reminders
- 1 hour before event: send reminder via WhatsApp (P2 priority, only if window open).
- Dashboard shows upcoming events on home page.

---

## Module 2: Financial Service

### Features
- Register income/expense from natural language.
- Auto-categorize: materials, labor, transport, food, tools, other.
- Query: daily/weekly/monthly totals, profit, category breakdown.
- Dashboard: revenue vs expenses chart, profit trend, category donut chart.
- Export: CSV/Excel download from dashboard.

### Calculations
- Revenue = SUM of income for period
- Expenses = SUM of expenses for period
- Profit = Revenue - Expenses
- All calculations from real database records. AI never invents numbers.

---

## Module 3: Budget/Quote Service

### Features
- Create budgets/quotes via AI conversation.
- AI collects: client name, items, quantities, prices.
- AI confirms totals with subscriber before generating.
- Generate professional PDF (see PDF rules below).
- Upload PDF to S3, send download link via WhatsApp.
- Track status: draft, sent, accepted, rejected.

### Service Orders
- Same module, different `document_type` field (`service_order` vs `budget`).
- Service orders include: service description, execution date, payment terms.
- Same PDF generation pipeline with different template layout.

### PDF Generation Rules (CRITICAL)
- **HEADER:** Subscriber's logo (from S3) + business name + address + phone + email.
- **NOT BossZap branding.** The PDF represents the subscriber's business.
- **BODY:** Itemized table (description, qty, unit price, total per item), grand total.
- **FOOTER:** Document number, date, validity period ("Valid for 15 days"), payment terms.
- **ALL text labels in the subscriber's preferred language** (column headers, footer text, etc.).
- **Professional design:** clean layout, readable on mobile, proper spacing.
- **Numbering:** Auto-increment per subscriber (BUD-001, BUD-002... or OS-001, OS-002...).

---

## Module 4: Query/Analytics Service

### Features
- Handles all "question" intents from subscribers.
- Queries the subscriber's own data ONLY.
- Formats response in natural language in subscriber's preferred language.

### Example Queries
| User Says | System Does |
|---|---|
| "How much did I spend on materials this month?" | SUM expenses WHERE category='materials' AND month=current |
| "What appointments do I have tomorrow?" | SELECT events WHERE event_date=tomorrow |
| "What was my biggest job?" | MAX income record |
| "How many quotes did I send this month?" | COUNT budgets WHERE month=current |
| "What's my profit this year?" | SUM income - SUM expenses WHERE year=current |
