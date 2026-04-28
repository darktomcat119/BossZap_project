import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Combustível', maxLength: 100 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ enum: ['income', 'expense', 'both'] })
  @IsOptional()
  @IsIn(['income', 'expense', 'both'])
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
