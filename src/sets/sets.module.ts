import { Module } from '@nestjs/common';
import { RmCalcService } from '../rm-calc/rm-calc.service';
import { RankingService } from '../ranking/ranking.service';
import { PrismaService } from '../prisma/prisma.service';
import { prismaProvider, PRISMA_PROVIDER } from './prisma.provider';
import { SetsController } from './sets.controller';
import { SetsService } from './sets.service';
import { Prisma } from '@prisma/client';

@Module({
  controllers: [SetsController],
  providers: [
    SetsService, 
    RmCalcService, 
    RankingService, 
    PrismaService,
    
    {
      provide: PRISMA_PROVIDER,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => {
        return {
          async countLogs(userId: string, exercise: string): Promise<number> {
            return prisma.setLog.count({
              where: {
                userId,
                exercise,
              },
            });
          },
          async saveSetLog(input: any) {
            return prisma.setLog.create({
              data: {
                userId: input.userId,
                exercise: input.exercise,
                weight: input.weight,
                reps: input.reps,
                estimatedOneRepMax: input.estimatedOneRepMax,
              },
            });
          },
          async saveRatingHistory(input: any) {
            return prisma.ratingHistory.create({
              data: {
                userId: input.userId,
                exercise: input.exercise,
                rating: input.rating,
                delta: input.delta,
              },
            });
          },
        };
      },
    },
  ],
})
export class SetsModule {}
