import { Module } from '@nestjs/common';
import { RmCalcService } from '../rm-calc/rm-calc.service';
import { RankingService } from '../ranking/ranking.service';
import { PrismaService } from '../prisma/prisma.service';
import { prismaProvider } from './prisma.provider';
import { SetsController } from './sets.controller';
import { SetsService } from './sets.service';

@Module({
  controllers: [SetsController],
  providers: [SetsService, RmCalcService, RankingService, PrismaService, prismaProvider],
})
export class SetsModule {}
