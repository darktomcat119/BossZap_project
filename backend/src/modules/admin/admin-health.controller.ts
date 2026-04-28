import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminHealthService } from './admin-health.service';

@ApiTags('Admin - Health')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/health')
export class AdminHealthController {
  constructor(private readonly service: AdminHealthService) {}

  @Get()
  @ApiOperation({ summary: 'Service health: database, redis, whatsapp, openai' })
  getServices() {
    return this.service.getServices();
  }

  @Get('queues')
  @ApiOperation({ summary: 'Queue depth, processing rate, failed jobs' })
  getQueues() {
    return this.service.getQueueMetrics();
  }

  @Get('workers')
  @ApiOperation({ summary: 'Connected BullMQ workers across all queues' })
  getWorkers() {
    return this.service.getWorkers();
  }

  @Get('failed-jobs')
  @ApiOperation({ summary: 'Recent failed jobs across WhatsApp queues' })
  getFailedJobs() {
    return this.service.getFailedJobs(50);
  }

  @Post('failed-jobs/clean')
  @ApiOperation({ summary: 'Remove all failed jobs from WhatsApp queues' })
  cleanFailedJobs() {
    return this.service.cleanFailedJobs();
  }
}
