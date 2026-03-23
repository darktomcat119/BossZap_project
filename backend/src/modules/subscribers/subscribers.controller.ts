import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SubscribersService } from './subscribers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Subscribers')
@Controller('subscribers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscribersController {
  constructor(
    private readonly subscribersService: SubscribersService,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get subscriber by ID' })
  async findOne(@Param('id') id: string) {
    return this.subscribersService.findById(id);
  }
}
