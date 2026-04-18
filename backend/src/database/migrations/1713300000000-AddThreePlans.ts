import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddThreePlans1713300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add stripe_price_id column to plans
    await queryRunner.query(`
      ALTER TABLE plans
      ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255)
    `);

    // Deactivate legacy "Profesional" plan
    await queryRunner.query(`
      UPDATE plans SET is_active = false
      WHERE name = 'Profesional'
    `);

    // Insert Starter plan
    await queryRunner.query(`
      INSERT INTO plans
        (name, price_monthly, max_budgets_per_month,
         max_messages_per_month, max_ai_calls_per_month,
         trial_days, is_active, stripe_price_id)
      VALUES
        ('Starter', 39.90, 20, 200, 100, 7, true, NULL)
      ON CONFLICT DO NOTHING
    `);

    // Insert Pro plan
    await queryRunner.query(`
      INSERT INTO plans
        (name, price_monthly, max_budgets_per_month,
         max_messages_per_month, max_ai_calls_per_month,
         trial_days, is_active, stripe_price_id)
      VALUES
        ('Pro', 59.90, 50, 500, 300, 7, true, NULL)
      ON CONFLICT DO NOTHING
    `);

    // Insert Business plan (unlimited = -1)
    await queryRunner.query(`
      INSERT INTO plans
        (name, price_monthly, max_budgets_per_month,
         max_messages_per_month, max_ai_calls_per_month,
         trial_days, is_active, stripe_price_id)
      VALUES
        ('Business', 79.90, -1, -1, -1, 7, true, NULL)
      ON CONFLICT DO NOTHING
    `);

    // Update default language for subscribers to pt-BR
    await queryRunner.query(`
      ALTER TABLE subscribers
      ALTER COLUMN preferred_language SET DEFAULT 'pt-BR'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM plans WHERE name IN ('Starter', 'Pro', 'Business')
    `);

    await queryRunner.query(`
      UPDATE plans SET is_active = true
      WHERE name = 'Profesional'
    `);

    await queryRunner.query(`
      ALTER TABLE plans DROP COLUMN IF EXISTS stripe_price_id
    `);

    await queryRunner.query(`
      ALTER TABLE subscribers
      ALTER COLUMN preferred_language SET DEFAULT 'es'
    `);
  }
}
