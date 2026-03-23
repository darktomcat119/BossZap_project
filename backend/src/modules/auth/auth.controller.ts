import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

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
    );
  }

  @Post('login')
  @ApiOperation({ summary: 'Subscriber login' })
  async login(@Body() dto: LoginDto) {
    return this.authService.loginSubscriber(
      dto.email,
      dto.password,
    );
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refresh_token);
  }
}
