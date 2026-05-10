import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Soft-delete columns for financial_records and budgets. Once a row is
 * soft-deleted, TypeORM's `@DeleteDateColumn` automatically excludes it
 * from default SELECTs unless `withDeleted: true` is passed. This gives
 * us an audit trail and a recovery path while keeping the user-facing
 * API behaviour identical to a hard delete.
 */
export class AddSoftDeleteToFinancialAndBudgets1777400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE financial_records
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL
    `);
    await queryRunner.query(`
      ALTER TABLE budgets
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL
    `);

    // Indexes on deleted_at speed up the "exclude soft-deleted" filter
    // that TypeORM applies on every find().
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_financial_records_deleted_at
        ON financial_records (deleted_at)
        WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_budgets_deleted_at
        ON budgets (deleted_at)
        WHERE deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_financial_records_deleted_at`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_budgets_deleted_at`,
    );
    await queryRunner.query(
      `ALTER TABLE financial_records DROP COLUMN IF EXISTS deleted_at`,
    );
    await queryRunner.query(
      `ALTER TABLE budgets DROP COLUMN IF EXISTS deleted_at`,
    );
  }
}
