import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  IsDateString,
} from 'class-validator';

export class CreateFinancialRecordDto {
  @ApiProperty({ enum: ['income', 'expense'], example: 'income' })
  @IsNotEmpty()
  @IsIn(['income', 'expense'])
  type: 'income' | 'expense';

  @ApiProperty({ example: 150.5, description: 'Positive monetary amount' })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({
    example: 'Monthly subscription payment',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 'services', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ example: 'John Doe', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reference_person?: string;

  @ApiProperty({
    example: '2026-03-23',
    description: 'ISO date string (YYYY-MM-DD)',
  })
  @IsNotEmpty()
  @IsDateString()
  record_date: string;
}
