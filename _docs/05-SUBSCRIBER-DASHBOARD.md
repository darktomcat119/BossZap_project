# BossZap — Subscriber Dashboard

## Authentication
- Email/password login OR phone number + OTP.
- JWT-based sessions (access: 15min, refresh: 7 days).
- Each subscriber sees ONLY their own data.
- Language switcher in navbar.

## Pages

### 1. Dashboard Home
- 4 summary cards: Total Revenue, Total Expenses, Profit, Upcoming Events.
- Each card: icon + label + large number + % change from last period.
- Positive change: green + up arrow. Negative: red + down arrow.
- Revenue vs Expenses chart (area chart, last 6 months).
- Upcoming events list (next 5 events).
- Recent transactions (last 10).
- Quick action buttons: "Create Budget", "Register Expense", "Register Income".

### 2. Financial Page
- Period selector (this week / this month / this year / custom range).
- Charts row: Revenue trend (line), Expense by category (donut), Daily profit (bar).
- Transaction table: search, filter by type, filter by category, date range, sortable columns.
- Export button: download as CSV or Excel.

### 3. Agenda/Calendar Page
- Monthly calendar view with events as colored dots/badges.
- Click date to see details in side panel.
- Color coding: scheduled (blue), completed (green), cancelled (gray).

### 4. Documents Page
- List all generated PDFs (budgets + service orders).
- Columns: document number, type, client name, amount, status, date, download.
- Filter by type (budget/service order), status, date range.
- Click to preview or download.

### 5. Profile Page
- Edit business info: name, address, phone, email.
- Upload/change logo (file upload component).
- View subscription status and plan details.
- Change preferred language.
- Payment history and next billing date.

## Real-Time Sync
- WebSocket (Socket.io) connection on dashboard load.
- Events to push:
  - New financial record created (from WhatsApp AI) → update charts/tables.
  - New event created → update calendar.
  - New budget generated → update documents list.
  - Subscription status change → update profile.
- Connection reconnects automatically on disconnect.
