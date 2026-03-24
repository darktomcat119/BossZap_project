import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateHsmTemplateDto {
  @ApiProperty({ example: 'appointment_reminder' })
  @IsString()
  @MaxLength(100)
  template_name: string;

  @ApiProperty({ example: 'es' })
  @IsString()
  @MaxLength(5)
  language: string;

  @ApiProperty({ example: 'UTILITY' })
  @IsString()
  @MaxLength(50)
  category: string;

  @ApiProperty({ example: 'Hello {{1}}, your appointment is on {{2}}.' })
  @IsString()
  body_text: string;
}
