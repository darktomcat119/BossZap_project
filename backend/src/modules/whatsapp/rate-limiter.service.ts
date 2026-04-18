import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const MAX_MESSAGES_PER_MINUTE = 30;
const WINDOW_SIZE_SECONDS = 60;

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis(
      this.configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
    );
  }

  async isRateLimited(phone: string): Promise<boolean> {
    const key = `rate:inbound:${phone}`;
    const now = Date.now();
    const windowStart = now - WINDOW_SIZE_SECONDS * 1000;

    const pipeline = this.redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zcard(key);
    pipeline.zadd(key, now, `${now}`);
    pipeline.expire(key, WINDOW_SIZE_SECONDS);

    const results = await pipeline.exec();
    if (!results) return false;

    const count = results[1]?.[1] as number;
    const limited = count >= MAX_MESSAGES_PER_MINUTE;

    if (limited) {
      this.logger.warn(`Rate limited: ${phone}`);
    }

    return limited;
  }
}
