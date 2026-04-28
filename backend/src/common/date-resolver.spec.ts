import {
  resolveDate,
  todayInZone,
  addDaysToIso,
  buildTodayContext,
  defaultTimezoneForLanguage,
} from './date-resolver';

describe('date-resolver', () => {
  // Pin "now" to a known instant so tests are deterministic.
  // 2026-04-26 14:00 UTC → still 2026-04-26 in São Paulo (UTC-3).
  const REAL_DATE = Date;
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-26T14:00:00.000Z')); // Sunday
  });
  afterAll(() => {
    jest.useRealTimers();
    void REAL_DATE; // keep reference to satisfy unused-var lint
  });

  it('todayInZone returns ISO date in São Paulo', () => {
    expect(todayInZone('America/Sao_Paulo')).toBe('2026-04-26');
  });

  it('addDaysToIso handles month/year rollover', () => {
    expect(addDaysToIso('2026-04-26', 1)).toBe('2026-04-27');
    expect(addDaysToIso('2026-04-30', 1)).toBe('2026-05-01');
    expect(addDaysToIso('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysToIso('2026-04-26', -1)).toBe('2026-04-25');
  });

  describe('relative keywords', () => {
    const tz = 'America/Sao_Paulo';
    it.each([
      ['hoje', '2026-04-26'],
      ['amanhã', '2026-04-27'],
      ['amanha', '2026-04-27'],
      ['depois de amanha', '2026-04-28'],
      ['ontem', '2026-04-25'],
      ['anteontem', '2026-04-24'],
      ['today', '2026-04-26'],
      ['tomorrow', '2026-04-27'],
      ['yesterday', '2026-04-25'],
      ['hoy', '2026-04-26'],
      ['mañana', '2026-04-27'],
      ['ayer', '2026-04-25'],
    ])('"%s" → %s', (input, expected) => {
      expect(resolveDate(input, { timezone: tz, language: 'pt-BR' })).toBe(
        expected,
      );
    });
  });

  describe('weekday names', () => {
    // Today is Sunday 2026-04-26 → Monday is 2026-04-27.
    const tz = 'America/Sao_Paulo';
    it.each([
      ['segunda', '2026-04-27'],
      ['segunda-feira', '2026-04-27'],
      ['seg', '2026-04-27'],
      ['terça', '2026-04-28'],
      ['terca-feira', '2026-04-28'],
      ['quarta', '2026-04-29'],
      ['quinta', '2026-04-30'],
      ['sexta', '2026-05-01'],
      ['sabado', '2026-05-02'],
      ['monday', '2026-04-27'],
      ['lunes', '2026-04-27'],
      ['proxima segunda', '2026-04-27'],
      ['próxima segunda', '2026-04-27'],
    ])('"%s" → %s', (input, expected) => {
      expect(resolveDate(input, { timezone: tz, language: 'pt-BR' })).toBe(
        expected,
      );
    });
  });

  describe('numeric formats', () => {
    const tz = 'America/Sao_Paulo';
    it.each([
      ['28/04/2026', '2026-04-28'],
      ['28-04-2026', '2026-04-28'],
      ['28.04.2026', '2026-04-28'],
      ['8/4/2026', '2026-04-08'],
      ['28/04/26', '2026-04-28'],
      ['28/04', '2026-04-28'], // current year
      ['2026-04-28', '2026-04-28'], // ISO passthrough
    ])('"%s" → %s', (input, expected) => {
      expect(resolveDate(input, { timezone: tz, language: 'pt-BR' })).toBe(
        expected,
      );
    });
  });

  describe('natural date phrases', () => {
    const tz = 'America/Sao_Paulo';
    it.each([
      ['28 de abril', '2026-04-28'],
      ['28 abril', '2026-04-28'],
      ['28 de abril de 2026', '2026-04-28'],
      ['April 28', '2026-04-28'],
      ['abril 28', '2026-04-28'],
    ])('"%s" → %s', (input, expected) => {
      expect(resolveDate(input, { timezone: tz, language: 'pt-BR' })).toBe(
        expected,
      );
    });
  });

  describe('invalid inputs return null', () => {
    const tz = 'America/Sao_Paulo';
    it.each([
      'qualquer coisa',
      '99/99/2026',
      '2026-99-99',
      'não sei',
      '32/04/2026',
    ])('"%s" → null', (input) => {
      expect(resolveDate(input, { timezone: tz, language: 'pt-BR' })).toBeNull();
    });

    it('empty input → null', () => {
      expect(resolveDate('', { timezone: tz, language: 'pt-BR' })).toBeNull();
      expect(resolveDate(null, { timezone: tz, language: 'pt-BR' })).toBeNull();
      expect(
        resolveDate(undefined, { timezone: tz, language: 'pt-BR' }),
      ).toBeNull();
    });
  });

  describe('buildTodayContext', () => {
    it('returns ISO + weekday + pretty for São Paulo', () => {
      const ctx = buildTodayContext('pt-BR', 'America/Sao_Paulo');
      expect(ctx.iso).toBe('2026-04-26');
      expect(ctx.weekday).toBe('Sunday'); // date-fns formats EEEE in en by default
      expect(ctx.pretty).toBe('26/04/2026');
    });
  });

  describe('defaultTimezoneForLanguage', () => {
    it('maps pt-BR → São Paulo', () => {
      expect(defaultTimezoneForLanguage('pt-BR')).toBe('America/Sao_Paulo');
    });
    it('maps es → Buenos Aires', () => {
      expect(defaultTimezoneForLanguage('es')).toBe('America/Buenos_Aires');
    });
    it('maps en → New York', () => {
      expect(defaultTimezoneForLanguage('en')).toBe('America/New_York');
    });
    it('falls back to São Paulo for unknown', () => {
      expect(defaultTimezoneForLanguage(undefined)).toBe('America/Sao_Paulo');
      expect(defaultTimezoneForLanguage('xx')).toBe('America/Sao_Paulo');
    });
  });
});
