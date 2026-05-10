import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Product catalog: items the subscriber sells (goods or services). Used
 * by the Catálogo dashboard page and referenced by Orçamentos so the AI
 * can resolve "100 reais de cimento" against a stored unit price instead
 * of trusting the LLM to invent prices.
 *
 * `type` distinguishes physical goods (stock-tracked) from services
 * (no stock). `unit` is the unit of measure shown on the budget line
 * ("un", "kg", "hora", "m²", etc.) — kept as free-form text so users
 * aren't boxed in by a fixed enum.
 */
export class CreateProducts1777500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS products (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
        name          VARCHAR(200) NOT NULL,
        description   TEXT NULL,
        sku           VARCHAR(50) NULL,
        price         DECIMAL(12, 2) NOT NULL DEFAULT 0,
        type          VARCHAR(10) NOT NULL DEFAULT 'product',
        unit          VARCHAR(20) NOT NULL DEFAULT 'un',
        stock         INTEGER NULL,
        is_active     BOOLEAN NOT NULL DEFAULT TRUE,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at    TIMESTAMPTZ NULL
      )
    `);

    // Most queries are "list active products for this subscriber" or
    // "find by name within this subscriber" — both benefit from a
    // subscriber-scoped index. Partial on deleted_at keeps the index
    // small even after soft-deletes accumulate.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_subscriber
        ON products (subscriber_id)
        WHERE deleted_at IS NULL
    `);

    // Case-insensitive lookup by name (used by the AI when resolving
    // budget line items like "100kg de cimento" against the catalog).
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_subscriber_name_lower
        ON products (subscriber_id, LOWER(name))
        WHERE deleted_at IS NULL
    `);

    // Per-subscriber unique name guard. Soft-deleted rows are excluded
    // so a user can re-create a product with the same name as a
    // previously-deleted one.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_products_subscriber_name_active
        ON products (subscriber_id, LOWER(name))
        WHERE deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS uq_products_subscriber_name_active`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_subscriber_name_lower`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_subscriber`);
    await queryRunner.query(`DROP TABLE IF EXISTS products`);
  }
}
