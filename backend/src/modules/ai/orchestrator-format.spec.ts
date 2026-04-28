/**
 * Focused tests for the deterministic formatter helpers on
 * OrchestratorService. We only test the pure helpers here — the full
 * service has DB dependencies that need a separate e2e harness.
 */
import { OrchestratorService } from './orchestrator.service';

// Reach into the private helpers for unit testing without spinning up
// the full Nest module. Type-cast is OK because these are pure helpers
// with no class-level state.
type AnyOrchestrator = {
  categoryDisplayName: (
    cat: string | null | undefined,
    lang: string,
  ) => string;
  formatFinanceReply: (
    intent: 'FINANCE_INCOME' | 'FINANCE_EXPENSE',
    record: Record<string, unknown>,
    language: string,
  ) => string;
  logoUploadInvitation: (lang: string) => string;
  formatEmptyQueryReply: (intent: string, lang: string) => string;
  isEmptyQueryResult: (data: unknown) => boolean;
};

function helpers(): AnyOrchestrator {
  // Construct without dependencies — none of the methods we test touch
  // injected services. The constructor only stores refs, so undefined
  // is fine for these pure helpers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inst = Object.create(OrchestratorService.prototype) as any;
  return inst as AnyOrchestrator;
}

describe('OrchestratorService formatters', () => {
  const o = helpers();

  describe('categoryDisplayName', () => {
    it.each([
      [null, 'pt-BR', 'Outros'],
      [undefined, 'pt-BR', 'Outros'],
      ['', 'pt-BR', 'Outros'],
      ['other', 'pt-BR', 'Outros'],
      ['other', 'es', 'Otros'],
      ['other', 'en', 'Other'],
      ['fuel', 'pt-BR', 'Combustível'],
      ['combustível', 'pt-BR', 'Combustível'],
      ['gasolina', 'pt-BR', 'Combustível'],
      ['gasolina', 'es', 'Combustible'],
      ['gas', 'en', 'Fuel'],
      ['comida', 'pt-BR', 'Alimentação'],
      ['marmita', 'pt-BR', 'Alimentação'],
      ['parafusos', 'pt-BR', 'Materiais'],
      ['materiales', 'es', 'Suministros'],
      ['aluguel', 'pt-BR', 'Aluguel'],
      ['rent', 'en', 'Rent'],
      ['imposto', 'pt-BR', 'Impostos'],
      ['impuesto', 'es', 'Impuestos'],
    ])('%s (%s) → %s', (input, lang, expected) => {
      expect(o.categoryDisplayName(input, lang)).toBe(expected);
    });

    it('Title-cases unknown categories instead of leaving them lowercase', () => {
      expect(o.categoryDisplayName('comida rapida', 'pt-BR')).toBe(
        'Comida Rapida',
      );
      expect(o.categoryDisplayName('hospedagem hotel', 'pt-BR')).toBe(
        'Hospedagem Hotel',
      );
    });

    it('falls back to pt-BR labels for unknown viewer language', () => {
      expect(o.categoryDisplayName('fuel', 'fr')).toBe('Combustível');
    });
  });

  describe('formatFinanceReply', () => {
    const baseRecord = {
      description: 'gasolina',
      amount: 150,
      category: 'gasolina',
      record_date: '2026-04-26',
    };

    it('renders the expected pt-BR template for an expense', () => {
      const out = o.formatFinanceReply('FINANCE_EXPENSE', baseRecord, 'pt-BR');
      expect(out).toContain('📝 Resumo do Registro');
      expect(out).toContain('🛍️ Descrição: gasolina');
      expect(out).toContain('R$ 150,00');
      expect(out).toContain('📂 Despesas: Combustível');
      expect(out).toContain('🗓️ Data: 26/04/2026');
      expect(out).toContain('✅ Status: Pago');
      expect(out).toContain(
        'Se precisar de algo a mais é só me chamar! 😄📈',
      );
    });

    it('uses Receitas + Recebido for income', () => {
      const out = o.formatFinanceReply(
        'FINANCE_INCOME',
        { ...baseRecord, category: 'venda', description: 'venda balcão' },
        'pt-BR',
      );
      expect(out).toContain('📂 Receitas: Vendas');
      expect(out).toContain('✅ Status: Recebido');
    });

    it('localizes to en', () => {
      const out = o.formatFinanceReply(
        'FINANCE_EXPENSE',
        { ...baseRecord, category: 'fuel' },
        'en',
      );
      expect(out).toContain('📝 Record Summary');
      expect(out).toContain('📂 Expenses: Fuel');
      expect(out).toContain('✅ Status: Paid');
    });

    it('handles missing category by defaulting to localized "other"', () => {
      const out = o.formatFinanceReply(
        'FINANCE_EXPENSE',
        { ...baseRecord, category: null },
        'pt-BR',
      );
      expect(out).toContain('📂 Despesas: Outros');
    });

    it('handles missing description with em-dash placeholder', () => {
      const out = o.formatFinanceReply(
        'FINANCE_EXPENSE',
        { ...baseRecord, description: null },
        'pt-BR',
      );
      expect(out).toContain('🛍️ Descrição: —');
    });
  });

  describe('logoUploadInvitation', () => {
    it.each([
      ['pt-BR', '🖼️ Beleza! É só me enviar a imagem da sua logo aqui mesmo no chat. 😊'],
      ['es', '🖼️ ¡Perfecto! Solo envíame la imagen de tu logo aquí mismo en el chat. 😊'],
      ['en', '🖼️ Great! Just send me the logo image right here in the chat. 😊'],
    ])('%s', (lang, expected) => {
      expect(o.logoUploadInvitation(lang)).toBe(expected);
    });

    it('falls back to pt-BR for unknown language', () => {
      expect(o.logoUploadInvitation('fr')).toBe(
        '🖼️ Beleza! É só me enviar a imagem da sua logo aqui mesmo no chat. 😊',
      );
    });
  });

  describe('isEmptyQueryResult', () => {
    it.each([
      [null, true],
      [undefined, true],
      [[], true],
      [{ data: [] }, true],
      [{ data: { records: [] } }, true],
      [{ data: { budgets: [] } }, true],
      [{ data: { events: [] } }, true],
      [
        {
          data: {
            count: 0,
            total_income: 0,
            total_expense: 0,
            net: 0,
          },
        },
        true,
      ],
    ])('returns true for empty shape %#', (input, expected) => {
      expect(o.isEmptyQueryResult(input)).toBe(expected);
    });

    it.each([
      [[{ id: 1 }], false],
      [{ data: [{ id: 1 }] }, false],
      [{ data: { records: [{ amount: 10 }] } }, false],
      [
        {
          data: {
            count: 0,
            total_income: 1500,
            total_expense: 0,
            net: 1500,
          },
        },
        false,
      ],
    ])('returns false for populated shape %#', (input, expected) => {
      expect(o.isEmptyQueryResult(input)).toBe(expected);
    });
  });

  describe('formatEmptyQueryReply', () => {
    it.each([
      ['SCHEDULE_QUERY', 'pt-BR', /📅.*compromisso/],
      ['SCHEDULE_QUERY', 'es', /📅.*cita/],
      ['SCHEDULE_QUERY', 'en', /📅.*appointments/],
      ['FINANCE_QUERY', 'pt-BR', /💰.*registro financeiro/],
      ['BUDGET_QUERY', 'pt-BR', /📋.*orçamentos/],
    ])('%s in %s matches expected wording', (intent, lang, re) => {
      expect(o.formatEmptyQueryReply(intent, lang)).toMatch(re);
    });
  });
});
