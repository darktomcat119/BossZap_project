import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminHsmService } from './admin-hsm.service';
import { CreateHsmTemplateDto } from './dto/create-hsm-template.dto';

@ApiTags('Admin - HSM Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/hsm-templates')
export class AdminHsmController {
  constructor(private readonly service: AdminHsmService) {}

  @Get()
  @ApiOperation({ summary: 'List all HSM templates' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new HSM template' })
  create(@Body() dto: CreateHsmTemplateDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an HSM template' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateHsmTemplateDto,
  ) {
    return this.service.update(id, dto);
  }
}
