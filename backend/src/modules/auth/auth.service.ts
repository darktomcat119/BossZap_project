import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Subscriber } from '../../database/entities/subscriber.entity';
import { AdminUser } from '../../database/entities/admin-user.entity';

const SALT_ROUNDS = 12;

interface TokenPayload {
  sub: string;
  type: 'subscriber' | 'admin';
  email?: string;
  phone?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async registerSubscriber(
    email: string,
    password: string,
    phone: string,
    ownerName: string,
  ): Promise<AuthTokens> {
    const existing = await this.subscriberRepo.findOne({
      where: [{ email }, { phone }],
    });
    if (existing) {
      throw new ConflictException(
        'Email or phone already registered',
      );
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const subscriber = this.subscriberRepo.create({
      email,
      password_hash: passwordHash,
      phone,
      owner_name: ownerName,
      status: 'onboarding',
    });
    await this.subscriberRepo.save(subscriber);

    return this.generateTokens({
      sub: subscriber.id,
      type: 'subscriber',
      email: subscriber.email ?? undefined,
      phone: subscriber.phone,
    });
  }

  async loginSubscriber(
    email: string,
    password: string,
  ): Promise<AuthTokens> {
    const subscriber = await this.subscriberRepo.findOne({
      where: { email },
    });
    if (!subscriber || !subscriber.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(
      password,
      subscriber.password_hash,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens({
      sub: subscriber.id,
      type: 'subscriber',
      email: subscriber.email ?? undefined,
      phone: subscriber.phone,
    });
  }

  async loginAdmin(
    email: string,
    password: string,
  ): Promise<AuthTokens> {
    const admin = await this.adminRepo.findOne({
      where: { email },
    });
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(
      password,
      admin.password_hash,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens({
      sub: admin.id,
      type: 'admin',
      email: admin.email,
    });
  }

  async refreshToken(token: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      return this.generateTokens({
        sub: payload.sub,
        type: payload.type,
        email: payload.email,
        phone: payload.phone,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getSubscriberProfile(subscriberId: string) {
    const subscriber = await this.subscriberRepo.findOne({
      where: { id: subscriberId },
      relations: ['plan'],
    });
    if (!subscriber) {
      throw new UnauthorizedException('Subscriber not found');
    }
    const { password_hash, ...profile } = subscriber;
    return profile;
  }

  async updateSubscriberProfile(
    subscriberId: string,
    data: Partial<Subscriber>,
  ) {
    const { password_hash, id, phone, ...allowed } = data as any;
    await this.subscriberRepo.update(subscriberId, allowed);
    return this.getSubscriberProfile(subscriberId);
  }

  private generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>(
        'JWT_REFRESH_EXPIRATION',
        '7d',
      ),
    });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
