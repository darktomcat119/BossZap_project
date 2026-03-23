# BossZap — Database Schema

## Core Principles
- PostgreSQL as primary database.
- Multi-tenant: every table with user data has `subscriber_id`.
- Every query MUST filter by `subscriber_id` (except admin queries).
- Use UUIDs for all primary keys.
- All timestamps in UTC with timezone.
- Money stored as DECIMAL(12,2) in the database, transmitted as integer cents in the API.

## Tables

### subscribers
```sql
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  business_name VARCHAR(255),
  owner_name VARCHAR(255),
  email VARCHAR(255),
  address TEXT,
  logo_url VARCHAR(500),
  preferred_language VARCHAR(5) DEFAULT 'es' NOT NULL,
  status VARCHAR(20) DEFAULT 'onboarding' NOT NULL,
  -- status: 'onboarding', 'active', 'suspended', 'cancelled'
  plan_id UUID REFERENCES plans(id),
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_subscribers_phone ON subscribers(phone);
```

### plans
```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  price_monthly DECIMAL(8,2) NOT NULL,
  max_budgets_per_month INTEGER NOT NULL DEFAULT 50,
  max_messages_per_month INTEGER NOT NULL DEFAULT 500,
  max_ai_calls_per_month INTEGER NOT NULL DEFAULT 300,
  trial_days INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### subscriptions
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES subscribers(id),
  plan_id UUID NOT NULL REFERENCES plans(id),
  status VARCHAR(20) DEFAULT 'trialing' NOT NULL,
  -- status: 'trialing', 'active', 'past_due', 'cancelled'
  payment_gateway_id VARCHAR(255),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_subscriptions_subscriber
  ON subscriptions(subscriber_id);
```

### payments
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  amount DECIMAL(8,2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  -- status: 'succeeded', 'failed', 'pending', 'refunded'
  payment_method VARCHAR(20) NOT NULL,
  -- payment_method: 'credit_card', 'pix'
  gateway_payment_id VARCHAR(255),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payments_subscription
  ON payments(subscription_id);
```

### events (Agenda)
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES subscribers(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location VARCHAR(255),
  status VARCHAR(20) DEFAULT 'scheduled' NOT NULL,
  -- status: 'scheduled', 'completed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_events_subscriber_date
  ON events(subscriber_id, event_date);
```

### financial_records
```sql
CREATE TABLE financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES subscribers(id),
  type VARCHAR(10) NOT NULL,
  -- type: 'income', 'expense'
  amount DECIMAL(12,2) NOT NULL,
  description VARCHAR(500),
  category VARCHAR(100),
  reference_person VARCHAR(255),
  record_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_financial_subscriber_date
  ON financial_records(subscriber_id, record_date);
CREATE INDEX idx_financial_subscriber_type_date
  ON financial_records(subscriber_id, type, record_date);
```

### budgets
```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES subscribers(id),
  document_type VARCHAR(20) DEFAULT 'budget' NOT NULL,
  -- document_type: 'budget', 'service_order'
  client_name VARCHAR(255),
  client_phone VARCHAR(20),
  client_email VARCHAR(255),
  description TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  -- items: [{description, quantity, unit_price, total}]
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' NOT NULL,
  -- status: 'draft', 'sent', 'accepted', 'rejected'
  pdf_url VARCHAR(500),
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_budgets_subscriber_created
  ON budgets(subscriber_id, created_at DESC);
```

### conversation_history
```sql
CREATE TABLE conversation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES subscribers(id),
  role VARCHAR(10) NOT NULL,
  -- role: 'user', 'assistant'
  content TEXT NOT NULL,
  intent VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_conversation_subscriber_created
  ON conversation_history(subscriber_id, created_at DESC);
```

### message_window_tracking
```sql
CREATE TABLE message_window_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID UNIQUE NOT NULL REFERENCES subscribers(id),
  last_inbound_at TIMESTAMPTZ NOT NULL,
  window_expires_at TIMESTAMPTZ NOT NULL
);
CREATE UNIQUE INDEX idx_window_subscriber
  ON message_window_tracking(subscriber_id);
```

### pending_notifications
```sql
CREATE TABLE pending_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES subscribers(id),
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(2) NOT NULL DEFAULT 'P2',
  -- priority: 'P1', 'P2', 'P3'
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  -- status: 'pending', 'sent', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);
CREATE INDEX idx_notifications_subscriber_status
  ON pending_notifications(subscriber_id, status);
```

### usage_tracking
```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES subscribers(id),
  month DATE NOT NULL,
  messages_count INTEGER DEFAULT 0,
  budgets_count INTEGER DEFAULT 0,
  ai_calls_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscriber_id, month)
);
CREATE UNIQUE INDEX idx_usage_subscriber_month
  ON usage_tracking(subscriber_id, month);
```

### admin_users
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'master' NOT NULL,
  preferred_language VARCHAR(5) DEFAULT 'es',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### hsm_templates (Meta approved templates)
```sql
CREATE TABLE hsm_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(100) NOT NULL,
  language VARCHAR(5) NOT NULL,
  -- language: 'es', 'en', 'pt_BR'
  category VARCHAR(50) NOT NULL,
  -- category: 'payment_recovery', 'reminder', 'notification'
  meta_template_id VARCHAR(255),
  meta_status VARCHAR(20) DEFAULT 'pending',
  -- meta_status: 'pending', 'approved', 'rejected'
  body_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_hsm_language_category
  ON hsm_templates(language, category);
```

### audit_log
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_subscriber
  ON audit_log(subscriber_id, created_at DESC);
```

## Data Retention Policy
- Active subscribers: all data retained indefinitely.
- Cancelled subscribers: data retained for 90 days.
- After 90 days: automated job archives data to cold storage (S3), then deletes from primary database.
- Archived data can be restored upon request within 1 year.
- Audit logs: retained for 2 years regardless of subscriber status.
