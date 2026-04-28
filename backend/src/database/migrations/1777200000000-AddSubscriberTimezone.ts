import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriberTimezone1777200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE subscribers
      ADD COLUMN IF NOT EXISTS timezone VARCHAR(64)
        NOT NULL DEFAULT 'America/Sao_Paulo'
    `);

    // Backfill existing rows by language so subscribers in other locales
    // get a sensible timezone instead of the default.
    await queryRunner.query(`
      UPDATE subscribers
         SET timezone = 'America/Buenos_Aires'
       WHERE preferred_language = 'es'
         AND timezone = 'America/Sao_Paulo'
    `);
    await queryRunner.query(`
      UPDATE subscribers
         SET timezone = 'America/New_York'
       WHERE preferred_language = 'en'
         AND timezone = 'America/Sao_Paulo'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE subscribers DROP COLUMN IF EXISTS timezone
    `);
  }
}
