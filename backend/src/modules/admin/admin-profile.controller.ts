import { Controller, Get, Patch, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminProfileService } from './admin-profile.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

interface AuthenticatedAdmin {
  id: string;
}

@ApiTags('Admin - Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/profile')
export class AdminProfileController {
  constructor(private readonly service: AdminProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current admin profile' })
  getProfile(@Req() req: Request) {
    const user = req.user as AuthenticatedAdmin;
    return this.service.getProfile(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update admin profile (email, preferred_language)' })
  updateProfile(@Req() req: Request, @Body() data: UpdateProfileDto) {
    const user = req.user as AuthenticatedAdmin;
    return this.service.updateProfile(user.id, data);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change admin password' })
  changePassword(@Req() req: Request, @Body() data: ChangePasswordDto) {
    const user = req.user as AuthenticatedAdmin;
    return this.service.changePassword(user.id, data);
  }
}
