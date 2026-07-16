import { Module } from '@nestjs/common';
import { SetsModule } from './sets/sets.module';

@Module({
  imports: [SetsModule],
})
export class AppModule {}
