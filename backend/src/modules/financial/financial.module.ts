import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialRecord } from '../../database/entities/financial-record.entity';
import { FinancialService } from './financial.service';
import { FinancialController } from './financial.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FinancialRecord])],
  controllers: [FinancialController],
  providers: [FinancialService],
  exports: [FinancialService],
})
export class FinancialModule {}
