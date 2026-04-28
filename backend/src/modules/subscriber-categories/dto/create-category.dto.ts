import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsIn } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Combustível', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ enum: ['income', 'expense', 'both'], default: 'both' })
  @IsOptional()
  @IsIn(['income', 'expense', 'both'])
  type?: string;
}
