import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { SetsModule } from './sets/sets.module';

@Module({
  imports: [
    AuthModule,
    SetsModule,
  ],
})
export class AppModule {}
