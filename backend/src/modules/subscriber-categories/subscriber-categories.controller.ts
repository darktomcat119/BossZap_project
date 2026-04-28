import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriberCategoriesService } from './subscriber-categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

interface AuthenticatedUser {
  id: string;
}

@ApiTags('Subscriber Categories')
@Controller('subscriber-categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriberCategoriesController {
  constructor(
    private readonly categoriesService: SubscriberCategoriesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all custom categories for the subscriber' })
  async findAll(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.categoriesService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new custom category' })
  async create(@Req() req: Request, @Body() data: CreateCategoryDto) {
    const user = req.user as AuthenticatedUser;
    return this.categoriesService.create(user.id, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a custom category' })
  async update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateCategoryDto,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.categoriesService.update(user.id, id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a custom category' })
  async remove(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const user = req.user as AuthenticatedUser;
    await this.categoriesService.remove(user.id, id);
  }
}
