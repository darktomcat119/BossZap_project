import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsInt, Min, IsOptional } from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({ example: 'Professional' })
  @IsString()
  name: string;

  @ApiProperty({ example: 29.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price_monthly: number;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(1)
  max_budgets_per_month: number;

  @ApiProperty({ example: 500 })
  @IsInt()
  @Min(1)
  max_messages_per_month: number;

  @ApiProperty({ example: 300 })
  @IsInt()
  @Min(1)
  max_ai_calls_per_month: number;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @IsInt()
  @Min(0)
  trial_days?: number;
}
