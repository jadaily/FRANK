import { Inject, Injectable } from '@nestjs/common';
import { BadRequestError } from '../errors';
import { RankingService } from '../ranking/ranking.service';
import { RmCalcService } from '../rm-calc/rm-calc.service';
import { LogSetDto } from './dto/log-set.dto';
import { PRISMA_PROVIDER } from './prisma.provider';

export interface SetLogResult {
  estimatedOneRepMax: number;
  rating: number;
  delta: number;
  percentile: number;
  dots: number;
  rankScore: number;
  badgeRank: string;
  currentFormRank: string;
  badgeProgressToNextRank: number;
  currentFormProgress: number;
  nextRankBoundary: number;
  peakDots: number;
  rollingAverageDots: number;
  frankScore: number;
  peakFrankScore: number;
  currentFrankScore: number;
  liftMultipliers: Record<string, number>;
}

@Injectable()
export class SetsService {
  constructor(
    private readonly rmCalcService: RmCalcService,
    private readonly rankingService: RankingService,
    @Inject(PRISMA_PROVIDER)
    private readonly prisma: {
      saveSetLog: (input: any) => Promise<any>;
      saveRatingHistory: (input: any) => Promise<any>;
    },
  ) {}

  async logSet(userId: string, input: LogSetDto): Promise<SetLogResult> {
    if (!userId) {
      throw new BadRequestError('userId is required from authentication layer');
    }

    const rmResult = this.rmCalcService.calculateOneRepMax(input.weight, input.reps);
    const rankingResult = this.rankingService.calculateRating(
      {
        weight: input.weight,
        reps: input.reps,
        sex: input.sex,
        bodyweightKg: input.bodyweightKg,
        exercise: input.exercise,
      },
      0,
    );

    await this.prisma.saveSetLog({
      userId: userId,
      exercise: input.exercise,
      weight: input.weight,
      reps: input.reps,
      estimatedOneRepMax: rmResult.estimate,
    });

    await this.prisma.saveRatingHistory({
      userId: userId,
      exercise: input.exercise,
      rating: rankingResult.rating,
      delta: rankingResult.delta,
    });

    return {
      estimatedOneRepMax: rmResult.estimate,
      rating: rankingResult.rating,
      delta: rankingResult.delta,
      percentile: rankingResult.percentile,
      dots: rankingResult.dots,
      rankScore: rankingResult.rankScore,
      badgeRank: rankingResult.badgeRank,
      currentFormRank: rankingResult.currentFormRank,
      badgeProgressToNextRank: rankingResult.badgeProgressToNextRank,
      currentFormProgress: rankingResult.currentFormProgress,
      nextRankBoundary: rankingResult.nextRankBoundary,
      peakDots: rankingResult.peakDots,
      rollingAverageDots: rankingResult.rollingAverageDots,
      frankScore: rankingResult.frankScore,
      peakFrankScore: rankingResult.peakFrankScore,
      currentFrankScore: rankingResult.currentFrankScore,
      liftMultipliers: rankingResult.liftMultipliers,
    };
  }
}
