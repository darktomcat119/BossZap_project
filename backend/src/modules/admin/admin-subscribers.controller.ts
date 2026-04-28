import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminSubscribersService } from './admin-subscribers.service';
import { AdminSubscriberFiltersDto } from './dto/admin-subscriber-filters.dto';

@ApiTags('Admin - Subscribers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/subscribers')
export class AdminSubscribersController {
  constructor(private readonly service: AdminSubscribersService) {}

  @Get()
  @ApiOperation({
    summary: 'List all subscribers with search, filter, sort, and pagination',
  })
  findAll(@Query() filters: AdminSubscriberFiltersDto) {
    return this.service.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get full subscriber detail including usage, payments, conversations',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  getDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getDetail(id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a subscriber' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.activate(id);
  }

  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspend a subscriber' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  suspend(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.suspend(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate (cancel) a subscriber' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deactivate(id);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Generate a temporary password for a subscriber' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  resetPassword(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.resetPassword(id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get audit logs for a subscriber' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  getLogs(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.service.getLogs(id, page, limit);
  }
}
