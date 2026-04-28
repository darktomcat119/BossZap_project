import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ enum: ['pt-BR', 'es', 'en'] })
  @IsOptional()
  @IsIn(['pt-BR', 'es', 'en'])
  preferred_language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;
}
