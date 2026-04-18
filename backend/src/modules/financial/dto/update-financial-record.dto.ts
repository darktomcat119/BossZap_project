import { PartialType } from '@nestjs/swagger';
import { CreateFinancialRecordDto } from './create-financial-record.dto';

export class UpdateFinancialRecordDto extends PartialType(
  CreateFinancialRecordDto,
) {}
