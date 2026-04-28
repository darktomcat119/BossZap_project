import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminNotificationsService } from './admin-notifications.service';

@ApiTags('Admin - Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly service: AdminNotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Aggregated admin notifications (failed payments, suspensions, queue failures, audits)',
  })
  list() {
    return this.service.getNotifications();
  }

  @Get('summary')
  @ApiOperation({ summary: 'Notification counts by severity (for badge)' })
  summary() {
    return this.service.getSummary();
  }
}
