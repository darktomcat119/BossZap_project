import {
  IsString,
  IsOptional,
  IsIn,
  IsArray,
  IsEmail,
  IsNumber,
  MaxLength,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BudgetItemDto {
  @ApiProperty({ example: 'Pintura externa' })
  @IsString()
  description: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  unit_price: number;
}

export class CreateBudgetDto {
  @ApiPropertyOptional({
    example: 'budget',
    enum: ['budget', 'service_order'],
    default: 'budget',
  })
  @IsOptional()
  @IsIn(['budget', 'service_order'])
  document_type?: string = 'budget';

  @ApiPropertyOptional({ example: 'João Silva', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  client_name?: string;

  @ApiPropertyOptional({ example: '+5511999999999', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  client_phone?: string;

  @ApiPropertyOptional({ example: 'joao@email.com' })
  @IsOptional()
  @IsEmail()
  client_email?: string;

  @ApiPropertyOptional({ example: 'Reforma completa do banheiro' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [BudgetItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetItemDto)
  items: BudgetItemDto[];

  @ApiPropertyOptional({
    example: '2026-04-15',
    description: 'ISO date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'valid_until must be a valid ISO date (YYYY-MM-DD)',
  })
  valid_until?: string;

  @ApiPropertyOptional({ example: 'Pagamento em 2x' })
  @IsOptional()
  @IsString()
  notes?: string;
}
