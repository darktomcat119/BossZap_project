import { IsIn, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBudgetStatusDto {
  @ApiProperty({
    example: 'sent',
    enum: ['draft', 'sent', 'accepted', 'rejected'],
  })
  @IsString()
  @IsIn(['draft', 'sent', 'accepted', 'rejected'])
  status: string;
}
