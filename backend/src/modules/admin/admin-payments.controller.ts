import {
  Controller,
  Get,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminPaymentsService } from './admin-payments.service';

@ApiTags('Admin - Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly service: AdminPaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List recent payments across all subscribers' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 100 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['succeeded', 'failed', 'pending', 'refunded'],
  })
  list(
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.service.list(limit, status);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Revenue today / week / month totals' })
  summary() {
    return this.service.summary();
  }
}
