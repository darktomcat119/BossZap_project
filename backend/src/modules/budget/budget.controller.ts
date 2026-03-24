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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetStatusDto } from './dto/update-budget-status.dto';

interface AuthenticatedUser {
  id: string;
  type: string;
  email?: string;
  phone?: string;
}

@ApiTags('Budgets')
@Controller('budgets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  @ApiOperation({ summary: 'Create a budget or service order' })
  async create(
    @Req() req: Request,
    @Body() data: CreateBudgetDto,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.budgetService.create(user.id, data);
  }

  @Get()
  @ApiOperation({
    summary: 'List budgets with filters and pagination',
  })
  @ApiQuery({
    name: 'documentType',
    required: false,
    enum: ['budget', 'service_order'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['draft', 'sent', 'accepted', 'rejected'],
  })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Req() req: Request,
    @Query('documentType') documentType?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.budgetService.findAll(user.id, {
      documentType,
      status,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a budget by ID' })
  async findById(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.budgetService.findById(user.id, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update budget status' })
  async updateStatus(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateBudgetStatusDto,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.budgetService.updateStatus(
      user.id,
      id,
      body.status,
    );
  }

  @Post(':id/generate-pdf')
  @ApiOperation({
    summary: 'Generate PDF and return download URL',
  })
  async generatePdf(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const user = req.user as AuthenticatedUser;
    const url = await this.budgetService.generatePdf(
      user.id,
      id,
    );
    return { pdf_url: url };
  }
}
