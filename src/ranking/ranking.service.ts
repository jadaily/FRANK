import { Injectable, BadRequestException } from '@nestjs/common';
import { BadRequestError } from '../errors';
import { RmCalcService } from '../rm-calc/rm-calc.service';
import { PrismaService } from '../prisma/prisma.service';
import { calculateDots, Sex } from './dots';
import { EXERCISE_KEYS, getExerciseConfig } from './exercise-config';

export interface RatingInput {
  exercise: string;
  weight: number;
  reps: number;
  bodyweightLbs: number;
  sex: Sex;
  rpe?: number;
}

export interface RatingResult {
  rating: number;
  delta: number;
  percentile: number;
  dots: number;
  opponentRating: number;
  rankScore: number;
  badgeRank: string;
  badgeColor: string;
  currentFormRank: string;
  currentFormColor: string;
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
export class RankingService {
  private readonly rpeMap: Record<number, number> = {
    10: 1.00, 9.5: 0.98, 9: 0.96, 8.5: 0.94, 
    8: 0.92, 7.5: 0.90, 7: 0.88, 6.5: 0.85, 6: 0.82
  };

  private readonly rankOrder = ['Stone', 'Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'] as const;

  private readonly rankColors: Record<string, string> = {
    Diamond: '#06b6d4',
    Platinum: '#94a3b8',
    Gold: '#f59e0b',
    Silver: '#60a5fa',
    Bronze: '#d97706',
    Iron: '#64748b',
    Stone: '#334155',
  };

  constructor(
    private readonly rmCalcService: RmCalcService) {}

  public determineRankTierFromScore(exercise: string, score: number): string {
    const data = this.getRankData(exercise, score);
    return data.rank;
  }

  public getPlacementColor(): string {
    return this.rankColors.Iron;
  }

  calculateRating(input: RatingInput, sessionCount = 0): RatingResult {
    this.validateInput(input);

    const exerciseKey = input.exercise.toLowerCase();
    const config = getExerciseConfig(exerciseKey);
    const isCompoundPowerlift = config.category === 'compound';

    let rmEstimate = 0;
    let dots = 0;
    let frankScore = 0;
    let worldRecordDots = 600;

    if (isCompoundPowerlift) {
      rmEstimate = this.rmCalcService.calculateOneRepMax(input.weight, input.reps).estimate;
      dots = calculateDots(rmEstimate, input.bodyweightLbs, input.sex);
      worldRecordDots = config.worldRecordDots![input.sex];
      frankScore = Number(((dots/worldRecordDots) * 10000).toFixed(1));
    } else {
      const rpeValue = input.rpe || 10;
      const intensity = this.rpeMap[rpeValue] || 1.00;

      rmEstimate = input.weight / intensity;

      const baseline = config.baseline || 100;
      frankScore = Number(((rmEstimate / baseline) * 10000).toFixed(1));
      dots = Number(((frankScore / 10000) * 500).toFixed(1));
    }

    const percentile = isCompoundPowerlift ? this.getPercentile(dots, exerciseKey, input.sex) : 0.5;
    const peakFrankScore = Math.max(frankScore, 1000);
    const currentFrankScore = Number((frankScore * 0.95).toFixed(1));
    const rollingAverageDots = Number((dots * 0.7 + Math.max(dots - 5, 0) * 0.3).toFixed(1));
    const rollingAverageFrankScore = Number(((rollingAverageDots / worldRecordDots) * 10000).toFixed(1));
    const peakDots = Math.max(dots, 100);

    const baseScore = Number((dots * 3 + percentile * 100).toFixed(1));
    const rankScore = Number((Math.max(0, baseScore) + sessionCount * 0.2).toFixed(1));

    const badgeRankData = this.getRankData(exerciseKey, peakFrankScore);
    const currentFormRankData = this.getRankData(exerciseKey, currentFrankScore);
    const delta = Number((Math.max(0.1, badgeRankData.step / 10) + percentile * 0.2).toFixed(2));
    const rating = Number((rankScore + delta).toFixed(1));

    const isPlaced = sessionCount >= 5;
    const finalBadgeRank = isPlaced ? badgeRankData.label : `Placement [${sessionCount}/5]`;
    const finalFormRank = isPlaced ? currentFormRankData.label : `Placement [${sessionCount}/5]`;
    const placementColor = this.rankColors.Iron;

    return {
      rating,
      delta,
      percentile: Number(percentile.toFixed(3)),
      dots: Number(dots.toFixed(1)),
      opponentRating: Number((rankScore + 12).toFixed(1)),
      rankScore,
      badgeRank: finalBadgeRank,
      badgeColor: isPlaced ? badgeRankData.color : placementColor,
      currentFormRank: finalFormRank,
      currentFormColor: isPlaced ? currentFormRankData.color : placementColor,
      badgeProgressToNextRank: isPlaced ? badgeRankData.progressToNextRank : 0,
      currentFormProgress: isPlaced ? currentFormRankData.progressToNextRank : 0,
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

    if (!Number.isFinite(input.weight) || !Number.isFinite(input.reps) || !Number.isFinite(input.bodyweightLbs)) {
      throw new BadRequestError('weight, reps, and bodyweight must be numeric');
    }

    if (input.weight <= 0 || input.reps <= 0 || input.bodyweightLbs <= 0) {
      throw new BadRequestError('weight, reps, and bodyweight must be positive');
    }

    if (input.reps > 12) {
      throw new BadRequestError('unreliable estimates, log a heavier set');
    }

    if (!['male', 'female'].includes(input.sex)) {
      throw new BadRequestError('sex must be male or female');
    }

    if (!EXERCISE_KEYS.includes(input.exercise.toLowerCase())) throw new BadRequestError('unsupported exercise');
  }

  private getPercentile(dots: number, exercise: string, sex: Sex): number {
    const distribution = getExerciseConfig(exercise).populationDistribution![sex];
    const zScore = (dots - distribution.mean) / distribution.stdDev;
    return this.normalCdf(zScore);
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

  // Finds the rank/tier band a value falls in given ascending rank floors (Stone..Diamond).
  // Diamond has no spec-given ceiling, so its internal tiers reuse the width of the band below it.
  private computeTierFromFloors(floors: number[], value: number): { rankIndex: number; tier: 'I' | 'II' | 'III'; tierFloor: number; tierCeiling: number } {
    const lastWidth = floors[floors.length - 1] - floors[floors.length - 2];
    const syntheticCeiling = floors[floors.length - 1] + lastWidth * 3;

    let rankIndex = floors.length - 1;
    for (let i = 0; i < floors.length; i++) {
      const ceiling = i === floors.length - 1 ? syntheticCeiling : floors[i + 1];
      if (value < ceiling) {
        rankIndex = i;
        break;
      }
    }

    const rankFloor = floors[rankIndex];
    const rankCeiling = rankIndex === floors.length - 1 ? syntheticCeiling : floors[rankIndex + 1];
    const width = rankCeiling - rankFloor;
    const tierIIFloor = rankFloor + width / 3;
    const tierIFloor = rankFloor + (2 * width) / 3;

    if (value < tierIIFloor) {
      return { rankIndex, tier: 'III', tierFloor: rankFloor, tierCeiling: tierIIFloor };
    }
    if (value < tierIFloor) {
      return { rankIndex, tier: 'II', tierFloor: tierIIFloor, tierCeiling: tierIFloor };
    }
    return { rankIndex, tier: 'I', tierFloor: tierIFloor, tierCeiling: rankCeiling };
  }

  public getRankData(exercise: string, score: number): { rank: string; tier: string; label: string; color: string; progressToNextRank: number; nextRankBoundary: number; step: number } {
    const cutoffs = getExerciseConfig(exercise).cutoffs;

    const floors = [0, cutoffs.stoneI, cutoffs.ironI, cutoffs.bronzeI, cutoffs.silverI, cutoffs.goldI, cutoffs.diamondI];
    const { rankIndex, tier, tierFloor, tierCeiling } = this.computeTierFromFloors(floors, score);
    const rank = this.rankOrder[rankIndex];
    const progress = Number((((score - tierFloor) / (tierCeiling - tierFloor)) * 100).toFixed(1));

    return {
      rank,
      tier,
      label: `${rank} ${tier}`,
      color: this.rankColors[rank],
      progressToNextRank: Math.max(0, Math.min(100, progress)),
      nextRankBoundary: Number(tierCeiling.toFixed(1)),
      step: rankIndex + 1,
    };
  }

  // Combines each already-placed exercise's % progress toward its own Diamond-I cutoff into one
  // aggregate rank, using the spec's generic percentage bands rather than any single exercise's scale.
  public getOverallRankData(exerciseScores: Record<string, { score: number; isPlaced: boolean }>): { rank: string; tier: string; label: string; color: string; score: number; progressToNextRank: number } {
    const placedEntries = Object.entries(exerciseScores).filter(([, v]) => v.isPlaced);
    if (placedEntries.length === 0) {
      return { rank: 'Unranked', tier: '', label: 'Unranked', color: this.rankColors.Stone, score: 0, progressToNextRank: 0 };
    }

    const percentages = placedEntries.map(([exercise, v]) => {
      const cutoffs = getExerciseConfig(exercise).cutoffs;
      return v.score / cutoffs.diamondI;
    });

    const averagePercentage = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    const averageScore = Number((placedEntries.reduce((sum, [, v]) => sum + v.score, 0) / placedEntries.length).toFixed(1));

    const genericFloors = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9];
    const { rankIndex, tier, tierFloor, tierCeiling } = this.computeTierFromFloors(genericFloors, averagePercentage);
    const rank = this.rankOrder[rankIndex];
    const progress = Number((((averagePercentage - tierFloor) / (tierCeiling - tierFloor)) * 100).toFixed(1));

    return {
      rank,
      tier,
      label: `${rank} ${tier}`,
      color: this.rankColors[rank],
      score: averageScore,
      progressToNextRank: Math.max(0, Math.min(100, progress)),
    };
  }

  private getLiftFrankScore(dots: number, worldRecordDots: number): number {
    return Number(((dots / worldRecordDots) * 10000).toFixed(1));
  }
}
