import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminSubscriberFiltersDto {
  @ApiPropertyOptional({
    description: 'Search by business name, owner name, phone, or email',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ['onboarding', 'active', 'suspended', 'cancelled'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['onboarding', 'active', 'suspended', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['created_at', 'business_name', 'owner_name', 'status'],
    default: 'created_at',
  })
  @IsOptional()
  @IsString()
  @IsIn(['created_at', 'business_name', 'owner_name', 'status'])
  sortBy?: string = 'created_at';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
