import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminMetricsService } from './admin-metrics.service';

@ApiTags('Admin - Metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/metrics')
export class AdminMetricsController {
  constructor(private readonly service: AdminMetricsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Total subscribers, active count, revenue this month, system stats' })
  getOverview() {
    return this.service.getOverview();
  }

  @Get('growth')
  @ApiOperation({ summary: 'Subscriber growth per month (last N months)' })
  @ApiQuery({ name: 'months', required: false, type: Number, example: 12 })
  getGrowth(@Query('months') months?: string) {
    const m = months ? parseInt(months, 10) : 12;
    return this.service.getGrowthTrend(m);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue per month (last N months)' })
  @ApiQuery({ name: 'months', required: false, type: Number, example: 12 })
  getRevenue(@Query('months') months?: string) {
    const m = months ? parseInt(months, 10) : 12;
    return this.service.getRevenueTrend(m);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Global usage stats: total messages, AI calls, budgets, top 10 subscribers' })
  getUsage() {
    return this.service.getUsageStats();
  }
}
