import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AgendaService, PaginatedEvents } from './agenda.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Event } from '../../database/entities/event.entity';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@ApiTags('Events')
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Get()
  @ApiOperation({ summary: 'List events with optional filters and pagination' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Range start (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Range end (YYYY-MM-DD)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default 20)' })
  async list(
    @Req() req: AuthenticatedRequest,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<PaginatedEvents> {
    return this.agendaService.findAll(req.user.id, {
      date,
      startDate,
      endDate,
      status,
      page,
      limit,
    });
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get next upcoming scheduled events' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of events (default 5)' })
  async upcoming(
    @Req() req: AuthenticatedRequest,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit?: number,
  ): Promise<Event[]> {
    return this.agendaService.findUpcoming(req.user.id, limit);
  }

  @Get('calendar/:year/:month')
  @ApiOperation({ summary: 'Get all events for a specific month' })
  @ApiParam({ name: 'year', type: Number, example: 2026 })
  @ApiParam({ name: 'month', type: Number, example: 4 })
  async monthlyCalendar(
    @Req() req: AuthenticatedRequest,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ): Promise<Event[]> {
    return this.agendaService.getMonthlyCalendar(req.user.id, year, month);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single event by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<Event> {
    return this.agendaService.findById(req.user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateEventDto,
  ): Promise<Event> {
    return this.agendaService.createEvent(req.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing event' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ): Promise<Event> {
    return this.agendaService.updateEvent(req.user.id, id, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an event' })
  @ApiParam({ name: 'id', type: String })
  async cancel(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<Event> {
    return this.agendaService.cancelEvent(req.user.id, id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark an event as completed' })
  @ApiParam({ name: 'id', type: String })
  async complete(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<Event> {
    return this.agendaService.completeEvent(req.user.id, id);
  }
}
