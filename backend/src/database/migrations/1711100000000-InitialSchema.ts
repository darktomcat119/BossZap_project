import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1711100000000
  implements MigrationInterface
{
  name = 'InitialSchema1711100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
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
      )
    `);

    await queryRunner.query(`
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
        password_hash VARCHAR(255),
        plan_id UUID REFERENCES plans(id),
        onboarding_completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_subscribers_phone
        ON subscribers(phone)
    `);

    await queryRunner.query(`
      CREATE TABLE subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscriber_id UUID NOT NULL REFERENCES subscribers(id),
        plan_id UUID NOT NULL REFERENCES plans(id),
        status VARCHAR(20) DEFAULT 'trialing' NOT NULL,
        payment_gateway_id VARCHAR(255),
        trial_ends_at TIMESTAMPTZ,
        current_period_start TIMESTAMPTZ,
        current_period_end TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_subscriptions_subscriber
        ON subscriptions(subscriber_id)
    `);

    await queryRunner.query(`
      CREATE TABLE payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscription_id UUID NOT NULL
          REFERENCES subscriptions(id),
        amount DECIMAL(8,2) NOT NULL,
        status VARCHAR(20) NOT NULL,
        payment_method VARCHAR(20) NOT NULL,
        gateway_payment_id VARCHAR(255),
        paid_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_payments_subscription
        ON payments(subscription_id)
    `);

    await queryRunner.query(`
      CREATE TABLE events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscriber_id UUID NOT NULL REFERENCES subscribers(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date DATE NOT NULL,
        event_time TIME,
        location VARCHAR(255),
        status VARCHAR(20) DEFAULT 'scheduled' NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_events_subscriber_date
        ON events(subscriber_id, event_date)
    `);

    await queryRunner.query(`
      CREATE TABLE financial_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscriber_id UUID NOT NULL REFERENCES subscribers(id),
        type VARCHAR(10) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        description VARCHAR(500),
        category VARCHAR(100),
        reference_person VARCHAR(255),
        record_date DATE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_financial_subscriber_date
        ON financial_records(subscriber_id, record_date)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_financial_subscriber_type_date
        ON financial_records(subscriber_id, type, record_date)
    `);

    await queryRunner.query(`
      CREATE TABLE budgets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscriber_id UUID NOT NULL REFERENCES subscribers(id),
        document_type VARCHAR(20) DEFAULT 'budget' NOT NULL,
        document_number VARCHAR(20),
        client_name VARCHAR(255),
        client_phone VARCHAR(20),
        client_email VARCHAR(255),
        description TEXT,
        items JSONB NOT NULL DEFAULT '[]',
        total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) DEFAULT 'draft' NOT NULL,
        pdf_url VARCHAR(500),
        valid_until DATE,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_budgets_subscriber_created
        ON budgets(subscriber_id, created_at DESC)
    `);

    await queryRunner.query(`
      CREATE TABLE conversation_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscriber_id UUID NOT NULL REFERENCES subscribers(id),
        role VARCHAR(10) NOT NULL,
        content TEXT NOT NULL,
        intent VARCHAR(50),
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_conversation_subscriber_created
        ON conversation_history(subscriber_id, created_at DESC)
    `);

    await queryRunner.query(`
      CREATE TABLE message_window_tracking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscriber_id UUID UNIQUE NOT NULL
          REFERENCES subscribers(id),
        last_inbound_at TIMESTAMPTZ NOT NULL,
        window_expires_at TIMESTAMPTZ NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_window_subscriber
        ON message_window_tracking(subscriber_id)
    `);

    await queryRunner.query(`
      CREATE TABLE pending_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscriber_id UUID NOT NULL REFERENCES subscribers(id),
        type VARCHAR(50) NOT NULL,
        priority VARCHAR(2) NOT NULL DEFAULT 'P2',
        payload JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        sent_at TIMESTAMPTZ
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_notifications_subscriber_status
        ON pending_notifications(subscriber_id, status)
    `);

    await queryRunner.query(`
      CREATE TABLE usage_tracking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscriber_id UUID NOT NULL REFERENCES subscribers(id),
        month DATE NOT NULL,
        messages_count INTEGER DEFAULT 0,
        budgets_count INTEGER DEFAULT 0,
        ai_calls_count INTEGER DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(subscriber_id, month)
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_usage_subscriber_month
        ON usage_tracking(subscriber_id, month)
    `);

    await queryRunner.query(`
      CREATE TABLE admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'master' NOT NULL,
        preferred_language VARCHAR(5) DEFAULT 'es',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE hsm_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_name VARCHAR(100) NOT NULL,
        language VARCHAR(5) NOT NULL,
        category VARCHAR(50) NOT NULL,
        meta_template_id VARCHAR(255),
        meta_status VARCHAR(20) DEFAULT 'pending',
        body_text TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_hsm_language_category
        ON hsm_templates(language, category)
    `);

    await queryRunner.query(`
      CREATE TABLE audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscriber_id UUID REFERENCES subscribers(id),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id UUID,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_audit_subscriber
        ON audit_log(subscriber_id, created_at DESC)
    `);

    await queryRunner.query(`
      INSERT INTO plans (name, price_monthly,
        max_budgets_per_month, max_messages_per_month,
        max_ai_calls_per_month, trial_days)
      VALUES ('Profesional', 29.90, 50, 500, 300, 7)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS audit_log');
    await queryRunner.query('DROP TABLE IF EXISTS hsm_templates');
    await queryRunner.query('DROP TABLE IF EXISTS admin_users');
    await queryRunner.query('DROP TABLE IF EXISTS usage_tracking');
    await queryRunner.query(
      'DROP TABLE IF EXISTS pending_notifications',
    );
    await queryRunner.query(
      'DROP TABLE IF EXISTS message_window_tracking',
    );
    await queryRunner.query(
      'DROP TABLE IF EXISTS conversation_history',
    );
    await queryRunner.query('DROP TABLE IF EXISTS budgets');
    await queryRunner.query(
      'DROP TABLE IF EXISTS financial_records',
    );
    await queryRunner.query('DROP TABLE IF EXISTS events');
    await queryRunner.query('DROP TABLE IF EXISTS payments');
    await queryRunner.query('DROP TABLE IF EXISTS subscriptions');
    await queryRunner.query('DROP TABLE IF EXISTS subscribers');
    await queryRunner.query('DROP TABLE IF EXISTS plans');
  }
}
