import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FinancialService } from './financial.service';
import { CreateFinancialRecordDto } from './dto/create-financial-record.dto';
import { UpdateFinancialRecordDto } from './dto/update-financial-record.dto';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@ApiTags('Financial')
@Controller('financial')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get()
  @ApiOperation({ summary: 'List financial records with filters and pagination' })
  @ApiQuery({ name: 'type', required: false, enum: ['income', 'expense'] })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('type') type?: 'income' | 'expense',
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.financialService.findAll(req.user.id, {
      type,
      category,
      startDate,
      endDate,
      search,
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
    });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get financial summary for a date range' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async getSummary(
    @Req() req: AuthenticatedRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financialService.getSummary(req.user.id, startDate, endDate);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get category breakdown for a date range' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'type', required: true, enum: ['income', 'expense'] })
  async getCategoryBreakdown(
    @Req() req: AuthenticatedRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('type') type: 'income' | 'expense',
  ) {
    return this.financialService.getCategoryBreakdown(
      req.user.id,
      startDate,
      endDate,
      type,
    );
  }

  @Get('daily')
  @ApiOperation({ summary: 'Get daily income/expense totals for a date range' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async getDailyTotals(
    @Req() req: AuthenticatedRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financialService.getDailyTotals(
      req.user.id,
      startDate,
      endDate,
    );
  }

  @Get('trend')
  @ApiOperation({ summary: 'Get monthly income/expense trend' })
  @ApiQuery({ name: 'months', required: false, type: Number, description: 'Number of months (default 6)' })
  async getMonthlyTrend(
    @Req() req: AuthenticatedRequest,
    @Query('months') months?: string,
  ) {
    return this.financialService.getMonthlyTrend(
      req.user.id,
      parseInt(months || '6', 10),
    );
  }

  @Get('export')
  @ApiOperation({ summary: 'Export financial records as CSV' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: ['income', 'expense'] })
  async exportCsv(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: 'income' | 'expense',
  ) {
    const records = await this.financialService.getRecordsForExport(
      req.user.id,
      startDate,
      endDate,
      type,
    );

    const BOM = '\uFEFF';
    const header = 'Date,Type,Amount,Category,Description,Reference Person';
    const rows = records.map((r) => {
      const description = escapeCsvField(r.description ?? '');
      const category = escapeCsvField(r.category ?? '');
      const referencePerson = escapeCsvField(r.reference_person ?? '');
      return `${r.record_date},${r.type},${r.amount},${category},${description},${referencePerson}`;
    });

    const csv = BOM + [header, ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="financial-records.csv"',
    );
    res.send(csv);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new financial record' })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() data: CreateFinancialRecordDto,
  ) {
    return this.financialService.createRecord(req.user.id, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a financial record' })
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateFinancialRecordDto,
  ) {
    return this.financialService.updateRecord(req.user.id, id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a financial record' })
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.financialService.deleteRecord(req.user.id, id);
    return { deleted: true };
  }
}

function escapeCsvField(value: string): string {
  if (
    value.includes(',') ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
