import { Controller, Get, Logger, ServiceUnavailableException } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const startedAt = Date.now();

    return Sentry.startSpan({ name: 'GET /health', op: 'http.server' }, async () => {
      const database = await this.checkDatabase();
      const status = database.status === 'ok' ? 'ok' : 'degraded';
      const durationMs = Date.now() - startedAt;

      const result = {
        status,
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        durationMs,
        checks: { database },
      };

      if (status === 'ok') {
        this.logger.log(`Health check ok (${durationMs}ms)`);
      } else {
        this.logger.warn(`Health check degraded (${durationMs}ms): ${database.error}`);
      }

      if (status !== 'ok') {
        throw new ServiceUnavailableException(result);
      }

      return result;
    });
  }

  private async checkDatabase(): Promise<{ status: 'ok' | 'error'; error?: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error) {
      this.logger.error('Database health check failed', (error as Error).stack);
      Sentry.captureException(error, { tags: { check: 'database' } });
      return { status: 'error', error: (error as Error).message };
    }
  }
}
