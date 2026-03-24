import { Injectable, Logger } from '@nestjs/common';
import { AgendaService } from '../agenda/agenda.service';
import { FinancialService } from '../financial/financial.service';
import { BudgetService } from '../budget/budget.service';

interface QueryResult {
  type: string;
  data: unknown;
  summary: string;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly agenda: AgendaService,
    private readonly financial: FinancialService,
    private readonly budget: BudgetService,
  ) {}

  async handleQuery(
    subscriberId: string,
    intent: string,
    extractedData: Record<string, unknown>,
    language: string,
  ): Promise<QueryResult> {
    switch (intent) {
      case 'SCHEDULE_QUERY':
        return this.querySchedule(
          subscriberId,
          extractedData,
        );
      case 'FINANCE_QUERY':
        return this.queryFinances(
          subscriberId,
          extractedData,
        );
      case 'BUDGET_QUERY':
        return this.queryBudgets(
          subscriberId,
          extractedData,
        );
      default:
        return this.queryGeneral(subscriberId);
    }
  }

  private async querySchedule(
    subscriberId: string,
    data: Record<string, unknown>,
  ): Promise<QueryResult> {
    const date = data.date as string | undefined;

    if (date) {
      const events = await this.agenda.findByDate(
        subscriberId,
        date,
      );
      return {
        type: 'schedule',
        data: events,
        summary: `Found ${events.length} event(s) on ${date}`,
      };
    }

    const upcoming = await this.agenda.findUpcoming(
      subscriberId,
      5,
    );
    return {
      type: 'schedule',
      data: upcoming,
      summary: `${upcoming.length} upcoming event(s)`,
    };
  }

  private async queryFinances(
    subscriberId: string,
    data: Record<string, unknown>,
  ): Promise<QueryResult> {
    const now = new Date();
    const startDate =
      (data.start_date as string) ||
      new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0];
    const endDate =
      (data.end_date as string) ||
      now.toISOString().split('T')[0];

    const category = data.category as string | undefined;

    if (category) {
      const breakdown =
        await this.financial.getCategoryBreakdown(
          subscriberId,
          startDate,
          endDate,
          (data.type as 'income' | 'expense') || 'expense',
        );
      const match = breakdown.find(
        (b) =>
          b.category.toLowerCase() ===
          category.toLowerCase(),
      );
      return {
        type: 'finance_category',
        data: match || { category, total: 0, count: 0 },
        summary: match
          ? `${category}: ${match.total} (${match.count} records)`
          : `No records for ${category}`,
      };
    }

    const summary = await this.financial.getSummary(
      subscriberId,
      startDate,
      endDate,
    );

    return {
      type: 'finance_summary',
      data: summary,
      summary:
        `Income: ${summary.totalIncome}, ` +
        `Expenses: ${summary.totalExpenses}, ` +
        `Profit: ${summary.profit}`,
    };
  }

  private async queryBudgets(
    subscriberId: string,
    data: Record<string, unknown>,
  ): Promise<QueryResult> {
    const result = await this.budget.findAll(subscriberId, {
      page: 1,
      limit: 5,
    });

    return {
      type: 'budgets',
      data: result.budgets,
      summary: `${result.total} total budget(s)`,
    };
  }

  private async queryGeneral(
    subscriberId: string,
  ): Promise<QueryResult> {
    const now = new Date();
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    )
      .toISOString()
      .split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [financials, upcoming, budgets] =
      await Promise.all([
        this.financial.getSummary(
          subscriberId,
          monthStart,
          today,
        ),
        this.agenda.findUpcoming(subscriberId, 3),
        this.budget.findAll(subscriberId, {
          page: 1,
          limit: 1,
        }),
      ]);

    return {
      type: 'general',
      data: { financials, upcoming, budgets: budgets.total },
      summary:
        `This month: income ${financials.totalIncome}, ` +
        `expenses ${financials.totalExpenses}. ` +
        `${upcoming.length} upcoming events. ` +
        `${budgets.total} budgets.`,
    };
  }
}
