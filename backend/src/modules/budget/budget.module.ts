import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget } from '../../database/entities/budget.entity';
import { Subscriber } from '../../database/entities/subscriber.entity';
import { BudgetService } from './budget.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { BudgetController } from './budget.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Budget, Subscriber])],
  controllers: [BudgetController],
  providers: [BudgetService, PdfGeneratorService],
  exports: [BudgetService],
})
export class BudgetModule {}
