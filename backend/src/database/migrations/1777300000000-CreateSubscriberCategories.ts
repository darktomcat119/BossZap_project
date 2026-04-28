import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriberCategories1777300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS subscriber_categories (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
        name       VARCHAR(100) NOT NULL,
        type       VARCHAR(10)  NOT NULL DEFAULT 'both',
        is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_subscriber_categories_subscriber
        ON subscriber_categories (subscriber_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS subscriber_categories`);
  }
}
