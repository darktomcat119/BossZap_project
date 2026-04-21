import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Subscriber } from '../../database/entities/subscriber.entity';
import { AdminUser } from '../../database/entities/admin-user.entity';
import { Plan } from '../../database/entities/plan.entity';
import { PaymentService } from '../payments/payment.service';

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

export interface RegisterResult extends AuthTokens {
  checkout_url?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly paymentService: PaymentService,
  ) {}

  async registerSubscriber(
    email: string,
    password: string,
    phone: string,
    ownerName: string,
    planName?: string,
  ): Promise<RegisterResult> {
    const existing = await this.subscriberRepo.findOne({
      where: [{ email }, { phone }],
    });
    if (existing) {
      throw new ConflictException('Email or phone already registered');
    }

    // Look up selected plan (default to Pro)
    const selectedPlanName = planName || 'Pro';
    const plan = await this.planRepo.findOne({
      where: {
        name:
          selectedPlanName.charAt(0).toUpperCase() +
          selectedPlanName.slice(1).toLowerCase(),
        is_active: true,
      },
    });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const subscriber = this.subscriberRepo.create({
      email,
      password_hash: passwordHash,
      phone,
      owner_name: ownerName,
      preferred_language: 'pt-BR',
      status: 'onboarding',
      plan_id: plan?.id ?? null,
    });
    await this.subscriberRepo.save(subscriber);

    const tokens = this.generateTokens({
      sub: subscriber.id,
      type: 'subscriber',
      email: subscriber.email ?? undefined,
      phone: subscriber.phone,
    });

    // Create Stripe checkout session if plan found
    let checkoutUrl: string | undefined;
    if (plan) {
      try {
        const result = await this.paymentService.createSubscription(
          subscriber.id,
          plan.id,
        );
        checkoutUrl = result.checkoutUrl;
      } catch (error) {
        this.logger.warn(
          `Could not create checkout for subscriber=${subscriber.id}: ${error}`,
        );
      }
    }

    return { ...tokens, checkout_url: checkoutUrl };
  }

  async loginSubscriber(email: string, password: string): Promise<AuthTokens> {
    const subscriber = await this.subscriberRepo.findOne({
      where: { email },
    });
    if (!subscriber || !subscriber.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, subscriber.password_hash);
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

  async loginAdmin(email: string, password: string): Promise<AuthTokens> {
    const admin = await this.adminRepo.findOne({
      where: { email },
    });
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
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

  async uploadSubscriberLogo(
    subscriberId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
  ): Promise<{ logo_url: string }> {
    if (!file || !file.buffer) {
      throw new UnauthorizedException('Missing file');
    }
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      throw new UnauthorizedException(
        'Unsupported file type. Use PNG, JPG or WEBP',
      );
    }
    const maxBytes = 2 * 1024 * 1024; // 2 MB
    if (file.size > maxBytes) {
      throw new UnauthorizedException('File too large (max 2 MB)');
    }

    const { S3Client, PutObjectCommand, GetObjectCommand } = await import(
      '@aws-sdk/client-s3'
    );
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

    const region = process.env.AWS_REGION ?? 'sa-east-1';
    const bucket = process.env.AWS_S3_BUCKET ?? 'bosszap-files';
    const ext = (file.originalname.match(/\.(png|jpe?g|webp)$/i)?.[1] ||
      file.mimetype.split('/')[1]).toLowerCase();
    const key = `subscribers/${subscriberId}/logo/${Date.now()}.${ext}`;

    const s3 = new S3Client({ region });
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 7 * 24 * 3600 },
    );

    await this.subscriberRepo.update(subscriberId, { logo_url: url });
    return { logo_url: url };
  }

  private generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
    });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
