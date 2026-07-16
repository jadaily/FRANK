import { Injectable, BadRequestException } from '@nestjs/common';
import { BadRequestError } from '../errors';
import { RmCalcService } from '../rm-calc/rm-calc.service';
import { PrismaService } from '../prisma/prisma.service';
import { calculateDots, Lift, RatingInput, RatingResult, Sex } from './dots';

@Injectable()
export class RankingService {
  constructor(
    private readonly rmCalcService: RmCalcService) {}

  calculateRating(input: RatingInput, sessionCount = 0): RatingResult {
    this.validateInput(input);

    const rmEstimate = this.rmCalcService.calculateOneRepMax(input.weight, input.reps).estimate;
    const rmKg = rmEstimate * 0.45359237;
    const dots = calculateDots(rmKg, input.bodyweightKg, input.sex);
    const percentile = this.getPercentile(dots, input.exercise, input.sex);

    const worldRecordDots = this.getWorldRecordDots(input.exercise, input.sex);
    const frankScore = Number(((dots / worldRecordDots) * 10000).toFixed(1));
    const peakFrankScore = Math.max(frankScore, 1000);
    const currentFrankScore = Number((frankScore * 0.95).toFixed(1));
    const rollingAverageDots = Number((dots * 0.7 + Math.max(dots - 5, 0) * 0.3).toFixed(1));
    const rollingAverageFrankScore = Number(((rollingAverageDots / worldRecordDots) * 10000).toFixed(1));
    const peakDots = Math.max(dots, 100);

    const baseScore = Number((dots * 3 + percentile * 100).toFixed(1));
    const rankScore = Number((Math.max(0, baseScore) + sessionCount * 0.2).toFixed(1));

    const badgeRankData = this.getRankData(peakFrankScore);
    const currentFormRankData = this.getRankData(currentFrankScore);
    const delta = Number((Math.max(0.1, badgeRankData.step / 10) + percentile * 0.2).toFixed(2));
    const rating = Number((rankScore + delta).toFixed(1));

    return {
      rating,
      delta,
      percentile: Number(percentile.toFixed(3)),
      dots: Number(dots.toFixed(1)),
      opponentRating: Number((rankScore + 12).toFixed(1)),
      rankScore,
      badgeRank: badgeRankData.rank,
      currentFormRank: currentFormRankData.rank,
      badgeProgressToNextRank: badgeRankData.progressToNextRank,
      currentFormProgress: currentFormRankData.progressToNextRank,
      nextRankBoundary: badgeRankData.nextRankBoundary,
      peakDots,
      rollingAverageDots,
      frankScore,
      peakFrankScore,
      currentFrankScore: Number(Math.max(currentFrankScore, rollingAverageFrankScore).toFixed(1)),
      liftMultipliers: {
        squat: Number(((this.getLiftFrankScore(input.exercise === 'squat' ? dots : dots * 0.95, worldRecordDots) || 0)).toFixed(1)),
        bench: Number(((this.getLiftFrankScore(input.exercise === 'bench press' ? dots : dots * 0.92, worldRecordDots) || 0)).toFixed(1)),
        deadlift: Number(((this.getLiftFrankScore(input.exercise === 'deadlift' ? dots : dots * 0.96, worldRecordDots) || 0)).toFixed(1)),
      },
    };
  }

  private validateInput(input: RatingInput): void {
    if (!input) {
      throw new BadRequestError('rating input is required');
    }

    if (!Number.isFinite(input.weight) || !Number.isFinite(input.reps) || !Number.isFinite(input.bodyweightKg)) {
      throw new BadRequestError('weight, reps, and bodyweight must be numeric');
    }

    if (input.weight <= 0 || input.reps <= 0 || input.bodyweightKg <= 0) {
      throw new BadRequestError('weight, reps, and bodyweight must be positive');
    }

    if (input.reps > 12) {
      throw new BadRequestError('unreliable estimates, log a heavier set');
    }

    if (!['male', 'female'].includes(input.sex)) {
      throw new BadRequestError('sex must be male or female');
    }

    if (!['squat', 'bench press', 'deadlift'].includes(input.exercise)) {
      throw new BadRequestError('unsupported exercise');
    }
  }

  private getPercentile(dots: number, exercise: Lift, sex: Sex): number {
    const distribution = this.getPopulationDistribution(exercise, sex);
    const zScore = (dots - distribution.mean) / distribution.stdDev;
    return this.normalCdf(zScore);
  }

  private getPopulationDistribution(exercise: Lift, sex: Sex) {
    const base = {
      squat: { male: { mean: 125, stdDev: 35 }, female: { mean: 110, stdDev: 30 } },
      'bench press': { male: { mean: 120, stdDev: 32 }, female: { mean: 105, stdDev: 28 } },
      deadlift: { male: { mean: 140, stdDev: 38 }, female: { mean: 125, stdDev: 33 } },
    } as const;

    return base[exercise][sex];
  }

  private normalCdf(value: number): number {
    return 0.5 * (1 + this.erf(value / Math.sqrt(2)));
  }

  private erf(value: number): number {
    const sign = value >= 0 ? 1 : -1;
    const abs = Math.abs(value);
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const t = 1 / (1 + p * abs);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-abs * abs);
    return sign * y;
  }

  private getRankData(score: number): { rank: string; progressToNextRank: number; nextRankBoundary: number; step: number } {
    const thresholds = [
      { rank: 'Initiate', boundary: 2499, step: 1 },
      { rank: 'Capable', boundary: 4999, step: 2 },
      { rank: 'Solid', boundary: 6999, step: 3 },
      { rank: 'Formidable', boundary: 8499, step: 4 },
      { rank: 'Elite', boundary: 9499, step: 5 },
      { rank: 'Untouchable', boundary: 10000, step: 6 },
    ] as const;

    for (const entry of thresholds) {
      if (score < entry.boundary) {
        const previousBoundary = entry === thresholds[0] ? 0 : thresholds[thresholds.indexOf(entry) - 1].boundary;
        const progress = Number(((score - previousBoundary) / (entry.boundary - previousBoundary)) * 100);
        return {
          rank: entry.rank,
          progressToNextRank: Number(Math.max(0, Math.min(100, progress)).toFixed(1)),
          nextRankBoundary: entry.boundary,
          step: entry.step,
        };
      }
    }

    return {
      rank: 'FRANK-Untouchable',
      progressToNextRank: 100,
      nextRankBoundary: 10000,
      step: 6,
    };
  }

  private getWorldRecordDots(exercise: Lift, sex: Sex): number {
    const worldRecordMap = {
      squat: { male: 600, female: 540 },
      'bench press': { male: 600, female: 540 },
      deadlift: { male: 640, female: 580 },
    } as const;

    return worldRecordMap[exercise][sex];
  }

  private getLiftFrankScore(dots: number, worldRecordDots: number): number {
    return Number(((dots / worldRecordDots) * 10000).toFixed(1));
  }
}
