import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBudgetDiscountAndSubscriberBranding1777250000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Budget: store the subtotal pre-discount and the discount itself
    // alongside the existing total_amount. Lets the PDF render the
    // breakdown ("Valor total / Desconto / Total Geral") faithfully and
    // gives us an audit trail for the math.
    await queryRunner.query(`
      ALTER TABLE budgets
      ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2)
    `);
    await queryRunner.query(`
      ALTER TABLE budgets
      ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(12, 2)
    `);

    // Subscriber: per-business defaults for the PDF footer.
    await queryRunner.query(`
      ALTER TABLE subscribers
      ADD COLUMN IF NOT EXISTS payment_methods VARCHAR(500)
    `);
    await queryRunner.query(`
      ALTER TABLE subscribers
      ADD COLUMN IF NOT EXISTS signature_role VARCHAR(100)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE budgets DROP COLUMN IF EXISTS discount_amount
    `);
    await queryRunner.query(`
      ALTER TABLE budgets DROP COLUMN IF EXISTS subtotal_amount
    `);
    await queryRunner.query(`
      ALTER TABLE subscribers DROP COLUMN IF EXISTS payment_methods
    `);
    await queryRunner.query(`
      ALTER TABLE subscribers DROP COLUMN IF EXISTS signature_role
    `);
  }
}
