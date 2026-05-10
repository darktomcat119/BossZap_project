import { Injectable, Logger } from '@nestjs/common';
import { AgendaService } from '../agenda/agenda.service';
import { FinancialService } from '../financial/financial.service';
import { BudgetService } from '../budget/budget.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ProductsService } from '../products/products.service';
import { SubscribersService } from '../subscribers/subscribers.service';
import {
  resolveDate,
  todayInZone,
  defaultTimezoneForLanguage,
} from '../../common/date-resolver';
import {
  UserInputError,
  BusinessRuleError,
  SystemError,
  categorize,
} from '../../common/ai-errors';

interface ActionContext {
  language: string;
  timezone: string;
}

interface ActionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  errorCode?: string;
  errorType?: 'user' | 'business' | 'system';
}

@Injectable()
export class ActionExecutorService {
  private readonly logger = new Logger(ActionExecutorService.name);

  constructor(
    private readonly agenda: AgendaService,
    private readonly financial: FinancialService,
    private readonly budget: BudgetService,
    private readonly analytics: AnalyticsService,
    private readonly products: ProductsService,
    private readonly subscribers: SubscribersService,
  ) {}

  async execute(
    subscriberId: string,
    intent: string,
    data: Record<string, unknown>,
    language: string,
    timezone?: string,
  ): Promise<ActionResult> {
    const ctx: ActionContext = {
      language,
      timezone: timezone || defaultTimezoneForLanguage(language),
    };
    try {
      switch (intent) {
        case 'SCHEDULE_CREATE':
          return await this.createEvent(subscriberId, data, ctx);
        case 'SCHEDULE_CANCEL':
          return await this.cancelEvent(subscriberId, data, ctx);
        case 'SCHEDULE_UPDATE':
          return await this.updateEvent(subscriberId, data, ctx);
        case 'SCHEDULE_QUERY':
          return await this.querySchedule(subscriberId, data, ctx);
        case 'FINANCE_INCOME':
          return await this.registerIncome(subscriberId, data, ctx);
        case 'FINANCE_EXPENSE':
          return await this.registerExpense(subscriberId, data, ctx);
        case 'FINANCE_QUERY':
          return await this.queryFinances(subscriberId, data, ctx);
        case 'BUDGET_CREATE':
          return await this.createBudget(subscriberId, data, ctx);
        case 'BUDGET_QUERY':
          return await this.queryBudgets(subscriberId, data, ctx);
        case 'PRODUCT_QUERY':
          return await this.queryProduct(subscriberId, data);
        case 'PROFILE_QUERY':
          return await this.queryProfile(subscriberId, data);
        case 'PROFILE_UPDATE':
          return await this.updateProfile(subscriberId, data);
        case 'LANGUAGE_CHANGE':
          return await this.changeLanguage(subscriberId, data);
        default:
          return { success: true };
      }
    } catch (error) {
      const cat = categorize(error);
      const msg = error instanceof Error ? error.message : String(error);
      // System errors get the full stack; user/business errors are
      // expected and only worth one info line.
      if (cat.type === 'system') {
        this.logger.error(
          `Action ${intent} failed [${cat.code}]: ${msg}`,
          error instanceof Error ? error.stack : undefined,
        );
      } else {
        this.logger.warn(`Action ${intent} ${cat.type} error [${cat.code}]: ${msg}`);
      }
      return {
        success: false,
        error: msg,
        errorCode: cat.code,
        errorType: cat.type,
      };
    }
  }

  /**
   * Normalize a loose time string ("7 pm", "7:30pm", "19h", "19:00")
   * to strict HH:MM that Postgres + the create-event DTO accept.
   * Returns undefined if the input is empty or unparseable.
   */
  private parseTime(raw: unknown): string | undefined {
    if (!raw) return undefined;
    const s = String(raw).trim().toLowerCase();
    if (!s) return undefined;

    // Already HH:MM or HH:MM:SS
    const hhmm = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (hhmm) {
      const h = Math.min(23, parseInt(hhmm[1], 10));
      const m = Math.min(59, parseInt(hhmm[2], 10));
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    // "7", "7 pm", "7:30 pm", "7h30", "19h"
    const m = s.match(/^(\d{1,2})(?:[:h](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?$/);
    if (!m) return undefined;
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    const meridiem = m[3]?.replace(/\./g, '');
    if (meridiem === 'pm' && h < 12) h += 12;
    if (meridiem === 'am' && h === 12) h = 0;
    if (h > 23 || min > 59) return undefined;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  /**
   * Resolve a free-form date in the subscriber's timezone. Returns ISO
   * (YYYY-MM-DD) on success. Returns undefined when the input was empty
   * (caller decides whether that's OK — e.g. defaults to today). Throws
   * UserInputError when the input was non-empty but unparseable, so the
   * orchestrator can show a helpful "I didn't understand the date" reply
   * instead of crashing the action.
   */
  private requireDate(raw: unknown, ctx: ActionContext): string {
    if (raw === undefined || raw === null || String(raw).trim() === '') {
      throw new UserInputError(
        'INVALID_DATE',
        'Date is required for this action',
      );
    }
    const iso = resolveDate(raw, {
      timezone: ctx.timezone,
      language: ctx.language,
    });
    if (!iso) {
      throw new UserInputError(
        'INVALID_DATE',
        `Could not resolve date from input: "${String(raw)}"`,
      );
    }
    return iso;
  }

  private resolveOptionalDate(
    raw: unknown,
    ctx: ActionContext,
  ): string | undefined {
    if (raw === undefined || raw === null || String(raw).trim() === '') {
      return undefined;
    }
    const iso = resolveDate(raw, {
      timezone: ctx.timezone,
      language: ctx.language,
    });
    if (!iso) {
      throw new UserInputError(
        'INVALID_DATE',
        `Could not resolve date from input: "${String(raw)}"`,
      );
    }
    return iso;
  }

  private requireAmount(raw: unknown): number {
    const n = Number(raw);
    if (!isFinite(n) || n <= 0) {
      throw new UserInputError(
        'INVALID_AMOUNT',
        `Could not parse amount: "${String(raw)}"`,
      );
    }
    return n;
  }

  private async createEvent(
    subscriberId: string,
    data: Record<string, unknown>,
    ctx: ActionContext,
  ): Promise<ActionResult> {
    const event = await this.agenda.createEvent(subscriberId, {
      title: (data.title as string) || 'New event',
      event_date: this.requireDate(data.date, ctx),
      // GPT picks slightly different field names across turns
      // ("time", "event_time", "start_time", "hour"). Accept any.
      event_time: this.pickTime(data),
      location: data.location as string | undefined,
      description: data.description as string | undefined,
    });
    return { success: true, data: event };
  }

  private pickTime(data: Record<string, unknown>): string | undefined {
    const candidates = ['time', 'event_time', 'start_time', 'hour'];
    for (const key of candidates) {
      const v = data[key];
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        const parsed = this.parseTime(v);
        if (parsed) return parsed;
      }
    }
    // Last-resort fallback: GPT sometimes packs the hour into the date
    // field (e.g. "2026-04-27T14:00:00Z" or "2026-04-27 14:00"). The
    // date resolver strips the time portion when normalising; here we
    // recover it for the event_time column.
    const rawDate = data.date as string | undefined;
    if (rawDate) {
      const m = String(rawDate).match(/[T ](\d{1,2}):(\d{2})/);
      if (m) {
        const h = Math.min(23, parseInt(m[1], 10));
        const min = Math.min(59, parseInt(m[2], 10));
        return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      }
    }
    return undefined;
  }

  private async cancelEvent(
    subscriberId: string,
    data: Record<string, unknown>,
    ctx: ActionContext,
  ): Promise<ActionResult> {
    const eventId = await this.resolveEventId(subscriberId, data, ctx);
    if (!eventId) {
      throw new BusinessRuleError(
        'RECORD_NOT_FOUND',
        'Could not locate a matching event to cancel',
      );
    }
    const event = await this.agenda.cancelEvent(subscriberId, eventId);
    return { success: true, data: event };
  }

  /**
   * Find a subscriber's event by direct UUID (rare — GPT almost never
   * knows it) or by a combination of date + title hints from the user.
   * Returns the event id or null when nothing matches.
   */
  private async resolveEventId(
    subscriberId: string,
    data: Record<string, unknown>,
    ctx: ActionContext,
  ): Promise<string | null> {
    const direct = data.event_id as string | undefined;
    if (direct) return direct;

    const dateHint = this.resolveOptionalDate(data.date, ctx);
    const titleHint = (data.title as string | undefined)?.toLowerCase();

    // Pull a short list of upcoming events and filter in code so the
    // matching logic stays simple and readable. For typical inboxes
    // (≤ 50 upcoming events) this is fine.
    const candidates = await this.agenda.findUpcoming(subscriberId, 50);
    const scoped = dateHint
      ? candidates.filter((e) => e.event_date === dateHint)
      : candidates;
    if (titleHint) {
      const exact = scoped.find((e) =>
        e.title.toLowerCase().includes(titleHint),
      );
      if (exact) return exact.id;
    }
    if (scoped.length === 1) return scoped[0].id;
    if (!dateHint && !titleHint && candidates.length === 1)
      return candidates[0].id;
    return null;
  }

  private async updateEvent(
    subscriberId: string,
    data: Record<string, unknown>,
    ctx: ActionContext,
  ): Promise<ActionResult> {
    const eventId = await this.resolveEventId(subscriberId, data, ctx);
    if (!eventId) {
      throw new BusinessRuleError(
        'RECORD_NOT_FOUND',
        'Could not locate a matching event to update',
      );
    }
    const updateData: Record<string, unknown> = {};
    const newDate = this.resolveOptionalDate(data.date, ctx);
    if (newDate) updateData.event_date = newDate;
    const newTime = this.pickTime(data);
    if (newTime) {
      updateData.event_time = newTime;
    } else if (data.time || data.event_time || data.start_time) {
      throw new UserInputError(
        'INVALID_TIME',
        `Could not parse time: ${String(data.time ?? data.event_time ?? data.start_time)}`,
      );
    }
    if (data.location) updateData.location = data.location;
    if (data.title) updateData.title = data.title;

    const event = await this.agenda.updateEvent(
      subscriberId,
      eventId,
      updateData,
    );
    return { success: true, data: event };
  }

  private async querySchedule(
    subscriberId: string,
    data: Record<string, unknown>,
    ctx: ActionContext,
  ): Promise<ActionResult> {
    const normalized: Record<string, unknown> = { ...data };
    if (data.date) normalized.date = this.requireDate(data.date, ctx);
    if (data.start_date)
      normalized.start_date = this.requireDate(data.start_date, ctx);
    if (data.end_date)
      normalized.end_date = this.requireDate(data.end_date, ctx);
    const result = await this.analytics.handleQuery(
      subscriberId,
      'SCHEDULE_QUERY',
      normalized,
      ctx.language,
    );
    return { success: true, data: result };
  }

  private async registerIncome(
    subscriberId: string,
    data: Record<string, unknown>,
    ctx: ActionContext,
  ): Promise<ActionResult> {
    const amount = this.requireAmount(data.amount);
    const recordDate =
      this.resolveOptionalDate(data.date, ctx) ?? todayInZone(ctx.timezone);
    const record = await this.financial.createRecord(subscriberId, {
      type: 'income',
      amount,
      description: data.description as string | undefined,
      category: data.category as string | undefined,
      reference_person: data.reference_person as string | undefined,
      record_date: recordDate,
    });
    return { success: true, data: record };
  }

  private async registerExpense(
    subscriberId: string,
    data: Record<string, unknown>,
    ctx: ActionContext,
  ): Promise<ActionResult> {
    const amount = this.requireAmount(data.amount);
    const recordDate =
      this.resolveOptionalDate(data.date, ctx) ?? todayInZone(ctx.timezone);
    const record = await this.financial.createRecord(subscriberId, {
      type: 'expense',
      amount,
      description: data.description as string | undefined,
      category: data.category as string | undefined,
      reference_person: data.reference_person as string | undefined,
      record_date: recordDate,
    });
    return { success: true, data: record };
  }

  private async queryFinances(
    subscriberId: string,
    data: Record<string, unknown>,
    ctx: ActionContext,
  ): Promise<ActionResult> {
    const normalized: Record<string, unknown> = { ...data };
    if (data.start_date)
      normalized.start_date = this.requireDate(data.start_date, ctx);
    if (data.end_date)
      normalized.end_date = this.requireDate(data.end_date, ctx);
    const result = await this.analytics.handleQuery(
      subscriberId,
      'FINANCE_QUERY',
      normalized,
      ctx.language,
    );
    return { success: true, data: result };
  }

  private async createBudget(
    subscriberId: string,
    data: Record<string, unknown>,
    ctx: ActionContext,
  ): Promise<ActionResult> {
    if (!data.items || !Array.isArray(data.items)) {
      return { success: true, data: { needsMoreInfo: true } };
    }

    const budget = await this.budget.create(subscriberId, {
      document_type: 'budget',
      client_name: data.client_name as string | undefined,
      client_phone: data.client_phone as string | undefined,
      client_email: data.client_email as string | undefined,
      items: data.items as Array<{
        description: string;
        quantity: number;
        unit_price: number;
      }>,
      description: data.description as string | undefined,
      notes: data.notes as string | undefined,
      valid_until: this.resolveValidUntil(data.valid_until, ctx),
      // Server resolves the math — see budget.service.create.
      discount_amount:
        typeof data.discount_amount === 'number'
          ? (data.discount_amount as number)
          : undefined,
      discount_percentage:
        typeof data.discount_percentage === 'number'
          ? (data.discount_percentage as number)
          : undefined,
    });

    // Generate the PDF + upload to S3 so we can attach it to the WhatsApp
    // reply. Failure to render the PDF must not break the whole reply —
    // log and return the budget without a pdf_url; the orchestrator falls
    // back to a text confirmation.
    let pdfUrl: string | undefined;
    try {
      pdfUrl = await this.budget.generatePdf(subscriberId, budget.id);
    } catch (err) {
      this.logger.warn(
        `PDF generation failed for budget ${budget.id}: ` +
          `${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return {
      success: true,
      data: { ...budget, pdf_url: pdfUrl ?? budget.pdf_url ?? null },
    };
  }

  private async queryBudgets(
    subscriberId: string,
    data: Record<string, unknown>,
    ctx: ActionContext,
  ): Promise<ActionResult> {
    const normalized: Record<string, unknown> = { ...data };
    if (data.start_date)
      normalized.start_date = this.requireDate(data.start_date, ctx);
    if (data.end_date)
      normalized.end_date = this.requireDate(data.end_date, ctx);
    const result = await this.analytics.handleQuery(
      subscriberId,
      'BUDGET_QUERY',
      normalized,
      ctx.language,
    );
    return { success: true, data: result };
  }

  /**
   * Catalog lookup: GPT extracts the user's noun phrase as
   * `product_name`; we resolve it against the subscriber's catalog
   * (case-insensitive). When nothing matches we still return success
   * with `data: null` so the orchestrator can short-circuit with a
   * "not in your catalog" reply instead of letting the LLM invent a
   * price.
   */
  private async queryProduct(
    subscriberId: string,
    data: Record<string, unknown>,
  ): Promise<ActionResult> {
    const rawName = (data.product_name ?? data.name ?? data.query) as
      | string
      | undefined;
    if (!rawName || !rawName.trim()) {
      return { success: true, data: null };
    }
    const product = await this.products.findByName(subscriberId, rawName);
    return { success: true, data: product };
  }

  private async queryProfile(
    subscriberId: string,
    data: Record<string, unknown>,
  ): Promise<ActionResult> {
    const subscriber = await this.subscribers.findById(subscriberId);
    if (!subscriber) {
      throw new BusinessRuleError('RECORD_NOT_FOUND', 'Subscriber not found');
    }
    const field = (data.field as string | undefined)?.toLowerCase();

    const allFields = {
      business_name: subscriber.business_name,
      owner_name: subscriber.owner_name,
      email: subscriber.email,
      phone: subscriber.phone,
      address: subscriber.address,
      preferred_language: subscriber.preferred_language,
      status: subscriber.status,
      logo_url: subscriber.logo_url,
      plan: subscriber.plan?.name ?? null,
    };

    // If a specific field is requested, return just that.
    if (field && field in allFields) {
      return {
        success: true,
        data: {
          field,
          value: (allFields as Record<string, unknown>)[field],
        },
      };
    }

    return { success: true, data: allFields };
  }

  private async updateProfile(
    subscriberId: string,
    data: Record<string, unknown>,
  ): Promise<ActionResult> {
    const update: Record<string, unknown> = {};
    if (data.business_name) {
      update.business_name = data.business_name;
    }
    if (data.owner_name) {
      update.owner_name = data.owner_name;
    }
    // Sanitize optional text fields — GPT sometimes writes literal
    // "Skipped" / "pular" / "n/a" when the user opts out. Never persist
    // those markers; treat them as null so the PDF footer stays clean.
    const email = this.sanitizeOptional(data.email);
    if (email !== null) update.email = email;
    const address = this.sanitizeOptional(data.address);
    if (address !== null) update.address = address;

    if (Object.keys(update).length > 0) {
      await this.subscribers.update(subscriberId, update);
    }
    return { success: true };
  }

  /**
   * Strip GPT skip-marker placeholders from optional free-text fields.
   * Returns null when the input is empty or a known skip marker, so
   * callers can treat it as "not provided" and skip the DB update.
   */
  private sanitizeOptional(raw: unknown): string | null {
    if (raw === null || raw === undefined) return null;
    const trimmed = String(raw).trim();
    if (trimmed === '') return null;
    const normalized = trimmed
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
    const skipMarkers = new Set([
      'skip', 'skipped', 'pular', 'pulado', 'saltar', 'saltado',
      'none', 'n/a', 'na', 'null', 'nulo', 'undefined', '-', '—',
      'no', 'nao', 'não', 'omitir', 'omitido',
    ]);
    if (skipMarkers.has(normalized)) return null;
    return trimmed;
  }

  /**
   * Resolve a validity period from GPT output into a YYYY-MM-DD date.
   * Accepts:
   *   - ISO date string ("2026-05-10", "10/05/2026")
   *   - Plain number or "N dias/days/días" → today + N days
   */
  private resolveValidUntil(
    raw: unknown,
    ctx: ActionContext,
  ): string | undefined {
    if (raw === undefined || raw === null || String(raw).trim() === '') {
      return undefined;
    }
    const s = String(raw).trim();

    // "7", "7 dias", "30 days", "15 días"
    const daysMatch = s.match(/^(\d+)(\s*(dias?|days?|d[ií]as?))?$/i);
    if (daysMatch) {
      const n = parseInt(daysMatch[1], 10);
      if (n > 0 && n <= 365) {
        const d = new Date();
        d.setDate(d.getDate() + n);
        return d.toISOString().split('T')[0];
      }
    }

    // Otherwise treat as a date string
    try {
      return this.resolveOptionalDate(s, ctx);
    } catch {
      return undefined;
    }
  }

  private async changeLanguage(
    subscriberId: string,
    data: Record<string, unknown>,
  ): Promise<ActionResult> {
    const language = data.language as string;
    const validLanguages = ['es', 'en', 'pt-BR'];

    if (!language || !validLanguages.includes(language)) {
      throw new UserInputError(
        'MISSING_REQUIRED_FIELD',
        `Invalid language code: "${String(language)}"`,
      );
    }

    await this.subscribers.update(subscriberId, {
      preferred_language: language,
    });
    return { success: true };
  }
}

// silence unused-import warnings while keeping classes available for
// future handlers that may need to throw them directly.
void SystemError;
