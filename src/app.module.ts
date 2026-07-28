import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { SetsModule } from './sets/sets.module';

@Module({
  imports: [
    AuthModule,
    HealthModule,
    SetsModule,
  ],
})
export class AppModule {}
