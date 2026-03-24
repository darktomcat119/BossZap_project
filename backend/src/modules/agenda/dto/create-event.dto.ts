import {
  IsString,
  IsOptional,
  MaxLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ example: 'Reunião com cliente', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'Discutir proposta comercial' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-04-15', description: 'ISO date (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'event_date must be a valid ISO date (YYYY-MM-DD)',
  })
  event_date: string;

  @ApiPropertyOptional({ example: '14:30', description: 'Time in HH:mm format' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'event_time must be in HH:mm format',
  })
  event_time?: string;

  @ApiPropertyOptional({ example: 'Escritório central', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;
}
