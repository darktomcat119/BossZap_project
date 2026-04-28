import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * One-time cleanup: GPT sometimes wrote literal "Skipped" (and variants) into
 * optional subscriber fields during onboarding before the sanitizeOptional()
 * guard was in place. This migration converts those markers to NULL so data
 * is clean for display and filtering.
 */
export class CleanSkippedSubscriberFields1777350000000
  implements MigrationInterface
{
  private readonly skipMarkers = [
    'skipped', 'skip', 'pular', 'pulado', 'saltar', 'saltado',
    'none', 'n/a', 'na', 'null', 'nulo', 'undefined',
    '-', '—', 'no', 'nao', 'não', 'omitir', 'omitido',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Build a single IN clause — values are string literals, not user input,
    // so inline quoting is safe here.
    const inList = this.skipMarkers.map((m) => `'${m}'`).join(', ');

    await queryRunner.query(`
      UPDATE subscribers
      SET email = NULL
      WHERE lower(trim(email)) IN (${inList})
    `);

    await queryRunner.query(`
      UPDATE subscribers
      SET address = NULL
      WHERE lower(trim(address)) IN (${inList})
    `);

    await queryRunner.query(`
      UPDATE subscribers
      SET owner_name = NULL
      WHERE lower(trim(owner_name)) IN (${inList})
    `);

    await queryRunner.query(`
      UPDATE subscribers
      SET business_name = NULL
      WHERE lower(trim(business_name)) IN (${inList})
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Data cannot be restored — down is intentionally a no-op.
  }
}
