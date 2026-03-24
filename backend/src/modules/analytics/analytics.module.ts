import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AgendaModule } from '../agenda/agenda.module';
import { FinancialModule } from '../financial/financial.module';
import { BudgetModule } from '../budget/budget.module';

@Module({
  imports: [AgendaModule, FinancialModule, BudgetModule],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
