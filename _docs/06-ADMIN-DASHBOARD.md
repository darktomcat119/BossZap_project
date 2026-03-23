# BossZap — Admin Dashboard (Master Panel)

## Authentication
- Separate admin login with elevated privileges.
- Only the BossZap owner has access.
- Independent language preference (does not affect subscribers).

## Pages

### 1. Overview
- Cards: Total subscribers, Active subscribers, Monthly revenue, System uptime.
- Charts: Subscriber growth trend, Revenue trend, Messages processed/day.
- Alerts panel: Payment failures, system errors, subscribers hitting limits.

### 2. Subscriber Management
- Table: all subscribers with search, filter by status, sort by date.
- Columns: name, phone, status, plan, messages this month, revenue, joined date.
- Actions: view details, activate, deactivate, suspend.
- Detail view: subscriber profile, usage metrics, payment history, conversation log.

### 3. Payment Status
- Who's paying, who's late, who cancelled.
- Payment history per subscriber.
- Revenue reports: daily, weekly, monthly.
- Failed payment alerts with recovery status.

### 4. Plan & Limits Management (CRITICAL)
- Create/edit plans: name, price, limits.
- Configure per plan:
  - Max budgets/quotes per month.
  - Max messages per month.
  - Max AI interactions per month.
- View which subscribers are approaching limits.
- When limit is reached, AI responds with friendly upgrade message in subscriber's language.

### 5. Usage Metrics
- Global: total messages, AI calls, PDFs generated, storage used.
- Per subscriber: message count, budget count, AI call count.
- Trends: daily/weekly/monthly charts.
- Cost analysis: approximate OpenAI API costs, storage costs.

### 6. System Logs
- Error logs with severity, timestamp, context.
- API call logs: WhatsApp, OpenAI, payment gateway.
- Webhook delivery status.
- Search and filter by date, severity, module.

### 7. System Health
- Queue status: depth, processing rate, failed jobs.
- Worker status: active workers, processing time.
- API response times: WhatsApp, OpenAI, database.
- Database metrics: connection pool, query performance.
- Uptime monitor.

### 8. HSM Template Management
- View all Meta templates and their approval status.
- Per language status (es: approved, en: pending, pt-BR: approved).
- Submit new templates for approval.
- Test template sending.
