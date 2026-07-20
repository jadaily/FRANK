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
                setType: 'working',
              },
            });
          },

          async findUserProfile(userId: string): Promise<any> {
            return prisma.user.findUnique({
              where: {id: userId},
            });
          },

          async getRatingHistoryByExercise(userId: string, exercise: string): Promise<any[]> {
            return prisma.ratingHistory.findMany({
              where: { userId, exercise },
              take: 4,
              orderBy: {createdAt: 'asc'},
            });
          },

          async getLatestRatingsForUser(userId: string): Promise<any[]> {
            const allRatings = await prisma.ratingHistory.findMany({
              where: { userId },
              orderBy: { createdAt: 'desc' },
            });

            const latestByExercise = new Map<string, any>();
            for (const rating of allRatings) {
              if (!latestByExercise.has(rating.exercise)) {
                latestByExercise.set(rating.exercise, rating);
              }
            }

            return Array.from(latestByExercise.values());
          },

          async getSetLogHistory(userId: string, exercise?: string): Promise<any[]> {
            return prisma.setLog.findMany({
              where: exercise ? { userId, exercise } : { userId },
              orderBy: { createdAt: 'desc' },
            });
          },

          async getRecentRatingHistory(userId: string, exercise: string, take: number): Promise<any[]> {
            return prisma.ratingHistory.findMany({
              where: { userId, exercise },
              take,
              orderBy: { createdAt: 'desc' },
            });
          },

          async saveSetLog(input: any) {
            return prisma.setLog.create({
              data: {
                userId: input.userId,
                exercise: input.exercise,
                weight: input.weight,
                reps: input.reps,
                rpe: input.rpe,
                setType: input.setType,
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
                isPlaced: input.isPlaced,
              },
            });
          },
          async updateHiddenExercises(userId: string, hiddenExercises: string[]) {
            return prisma.user.update({
              where: { id: userId },
              data: { hiddenExercises },
              select: { hiddenExercises: true },
            });
          },
        };
      },
    },
  ],
})
export class SetsModule {}
