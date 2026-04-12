import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly redis: Redis;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.redis = new Redis(
      process.env.REDIS_URL || 'redis://localhost:6379',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Full health check' })
  async check() {
    const db = await this.checkDatabase();
    const redis = await this.checkRedis();
    const allHealthy = db.status === 'up' && redis.status === 'up';

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: { database: db, redis },
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  async ready() {
    const db = await this.checkDatabase();
    if (db.status !== 'up') {
      return { ready: false, reason: 'database down' };
    }
    return { ready: true };
  }

  private async checkDatabase(): Promise<{
    status: string;
    latency?: number;
  }> {
    try {
      const start = Date.now();
      await this.dataSource.query('SELECT 1');
      return { status: 'up', latency: Date.now() - start };
    } catch {
      return { status: 'down' };
    }
  }

  private async checkRedis(): Promise<{
    status: string;
    latency?: number;
  }> {
    try {
      const start = Date.now();
      await this.redis.ping();
      return { status: 'up', latency: Date.now() - start };
    } catch {
      return { status: 'down' };
    }
  }
}
