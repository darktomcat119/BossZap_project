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
import { AdminLogsService } from './admin-logs.service';

@ApiTags('Admin - Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/logs')
export class AdminLogsController {
  constructor(private readonly service: AdminLogsService) {}

  @Get('audit')
  @ApiOperation({ summary: 'Paginated audit logs with optional filters' })
  @ApiQuery({ name: 'subscriberId', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, example: '2025-01-01' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, example: '2025-12-31' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  getAuditLogs(
    @Query('subscriberId') subscriberId?: string,
    @Query('action') action?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAuditLogs({
      subscriberId,
      action,
      dateFrom,
      dateTo,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('system')
  @ApiOperation({ summary: 'System log viewer (placeholder)' })
  getSystemLogs() {
    return this.service.getSystemLogs();
  }
}
