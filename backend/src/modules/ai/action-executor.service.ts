import { Injectable, Logger } from '@nestjs/common';
import { AgendaService } from '../agenda/agenda.service';
import { FinancialService } from '../financial/financial.service';
import { BudgetService } from '../budget/budget.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { SubscribersService } from '../subscribers/subscribers.service';

interface ActionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

@Injectable()
export class ActionExecutorService {
  private readonly logger = new Logger(ActionExecutorService.name);

  constructor(
    private readonly agenda: AgendaService,
    private readonly financial: FinancialService,
    private readonly budget: BudgetService,
    private readonly analytics: AnalyticsService,
    private readonly subscribers: SubscribersService,
  ) {}

  async execute(
    subscriberId: string,
    intent: string,
    data: Record<string, unknown>,
    language: string,
  ): Promise<ActionResult> {
    try {
      switch (intent) {
        case 'SCHEDULE_CREATE':
          return this.createEvent(subscriberId, data);
        case 'SCHEDULE_CANCEL':
          return this.cancelEvent(subscriberId, data);
        case 'SCHEDULE_UPDATE':
          return this.updateEvent(subscriberId, data);
        case 'SCHEDULE_QUERY':
          return this.querySchedule(subscriberId, data, language);
        case 'FINANCE_INCOME':
          return this.registerIncome(subscriberId, data);
        case 'FINANCE_EXPENSE':
          return this.registerExpense(subscriberId, data);
        case 'FINANCE_QUERY':
          return this.queryFinances(subscriberId, data, language);
        case 'BUDGET_CREATE':
          return this.createBudget(subscriberId, data);
        case 'BUDGET_QUERY':
          return this.queryBudgets(subscriberId, data, language);
        case 'PROFILE_UPDATE':
          return this.updateProfile(subscriberId, data);
        case 'LANGUAGE_CHANGE':
          return this.changeLanguage(subscriberId, data);
        default:
          return { success: true };
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Action ${intent} failed: ${msg}`);
      return { success: false, error: msg };
    }
  }

  private async createEvent(
    subscriberId: string,
    data: Record<string, unknown>,
  ): Promise<ActionResult> {
    const event = await this.agenda.createEvent(subscriberId, {
      title: (data.title as string) || 'New event',
      event_date: data.date as string,
      event_time: data.time as string | undefined,
      location: data.location as string | undefined,
      description: data.description as string | undefined,
    });
    return { success: true, data: event };
  }

  private async cancelEvent(
    subscriberId: string,
    data: Record<string, unknown>,
  ): Promise<ActionResult> {
    const eventId = data.event_id as string;
    if (!eventId) {
      return {
        success: false,
        error: 'No event ID provided',
      };
    }
    const event = await this.agenda.cancelEvent(subscriberId, eventId);
    return { success: true, data: event };
  }

  private async updateEvent(
    subscriberId: string,
    data: Record<string, unknown>,
  ): Promise<ActionResult> {
    const eventId = data.event_id as string;
    if (!eventId) {
      return {
        success: false,
        error: 'No event ID provided',
      };
    }
    const updateData: Record<string, unknown> = {};
    if (data.date) updateData.event_date = data.date;
    if (data.time) updateData.event_time = data.time;
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
    language: string,
  ): Promise<ActionResult> {
    const result = await this.analytics.handleQuery(
      subscriberId,
      'SCHEDULE_QUERY',
      data,
      language,
    );
    return { success: true, data: result };
  }

  private async registerIncome(
    subscriberId: string,
    data: Record<string, unknown>,
  ): Promise<ActionResult> {
    const record = await this.financial.createRecord(subscriberId, {
      type: 'income',
      amount: data.amount as number,
      description: data.description as string | undefined,
      category: data.category as string | undefined,
      reference_person: data.reference_person as string | undefined,
      record_date:
        (data.date as string) || new Date().toISOString().split('T')[0],
    });
    return { success: true, data: record };
  }

  private async registerExpense(
    subscriberId: string,
    data: Record<string, unknown>,
  ): Promise<ActionResult> {
    const record = await this.financial.createRecord(subscriberId, {
      type: 'expense',
      amount: data.amount as number,
      description: data.description as string | undefined,
      category: data.category as string | undefined,
      reference_person: data.reference_person as string | undefined,
      record_date:
        (data.date as string) || new Date().toISOString().split('T')[0],
    });
    return { success: true, data: record };
  }

  private async queryFinances(
    subscriberId: string,
    data: Record<string, unknown>,
    language: string,
  ): Promise<ActionResult> {
    const result = await this.analytics.handleQuery(
      subscriberId,
      'FINANCE_QUERY',
      data,
      language,
    );
    return { success: true, data: result };
  }

  private async createBudget(
    subscriberId: string,
    data: Record<string, unknown>,
  ): Promise<ActionResult> {
    if (!data.items || !Array.isArray(data.items)) {
      return { success: true, data: { needsMoreInfo: true } };
    }

    const budget = await this.budget.create(subscriberId, {
      document_type: 'budget',
      client_name: data.client_name as string | undefined,
      client_phone: data.client_phone as string | undefined,
      items: data.items as Array<{
        description: string;
        quantity: number;
        unit_price: number;
      }>,
      description: data.description as string | undefined,
      notes: data.notes as string | undefined,
    });
    return { success: true, data: budget };
  }

  private async queryBudgets(
    subscriberId: string,
    data: Record<string, unknown>,
    language: string,
  ): Promise<ActionResult> {
    const result = await this.analytics.handleQuery(
      subscriberId,
      'BUDGET_QUERY',
      data,
      language,
    );
    return { success: true, data: result };
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
    if (data.email) update.email = data.email;
    if (data.address) update.address = data.address;

    if (Object.keys(update).length > 0) {
      await this.subscribers.update(subscriberId, update);
    }
    return { success: true };
  }

  private async changeLanguage(
    subscriberId: string,
    data: Record<string, unknown>,
  ): Promise<ActionResult> {
    const language = data.language as string;
    const validLanguages = ['es', 'en', 'pt-BR'];

    if (!language || !validLanguages.includes(language)) {
      return {
        success: false,
        error: 'Invalid language',
      };
    }

    await this.subscribers.update(subscriberId, {
      preferred_language: language,
    });
    return { success: true };
  }
}
