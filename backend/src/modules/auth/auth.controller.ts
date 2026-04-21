import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsIn } from 'class-validator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  business_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  owner_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @IsIn(['es', 'en', 'pt-BR'])
  preferred_language?: string;
}

@ApiTags('Auth - Subscriber')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new subscriber' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.registerSubscriber(
      dto.email,
      dto.password,
      dto.phone,
      dto.owner_name,
      dto.plan,
    );
  }

  @Post('login')
  @ApiOperation({ summary: 'Subscriber login' })
  async login(@Body() dto: LoginDto) {
    return this.authService.loginSubscriber(dto.email, dto.password);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refresh_token);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Client-side logout (no server state to clear)' })
  logout() {
    return { success: true };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current subscriber profile' })
  async getProfile(@Req() req: any) {
    return this.authService.getSubscriberProfile(req.user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update subscriber profile' })
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateSubscriberProfile(req.user.id, dto);
  }

  @Post('profile/logo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Upload business logo (PNG/JPG/WEBP, max 2MB). Returns signed URL.',
  })
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async uploadLogo(
    @Req() req: any,
    @UploadedFile()
    file: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    },
  ) {
    return this.authService.uploadSubscriberLogo(req.user.id, file);
  }
}
