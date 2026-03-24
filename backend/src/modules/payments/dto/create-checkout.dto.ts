import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutDto {
  @ApiProperty({
    description: 'Plan ID to subscribe to',
    example: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  plan_id: string;
}
