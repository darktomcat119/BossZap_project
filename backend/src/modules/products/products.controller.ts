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
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

interface AuthenticatedUser {
  id: string;
}

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products / services for the subscriber' })
  @ApiQuery({ name: 'type', required: false, enum: ['product', 'service'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  async findAll(
    @Req() req: Request,
    @Query('type') type?: 'product' | 'service',
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.productsService.findAll(user.id, {
      type,
      search,
      activeOnly: includeInactive !== 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single product by id' })
  async findOne(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.productsService.findById(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a product or service' })
  async create(@Req() req: Request, @Body() data: CreateProductDto) {
    const user = req.user as AuthenticatedUser;
    return this.productsService.create(user.id, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product or service' })
  async update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateProductDto,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.productsService.update(user.id, id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a product or service' })
  async remove(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const user = req.user as AuthenticatedUser;
    await this.productsService.remove(user.id, id);
  }
}
