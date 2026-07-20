import { Inject, Injectable } from '@nestjs/common';
import { BadRequestError } from '../errors';
import { RankingService } from '../ranking/ranking.service';
import { RmCalcService } from '../rm-calc/rm-calc.service';
import { EXERCISE_KEYS, getExerciseConfig } from '../ranking/exercise-config';
import { LogSetDto } from './dto/log-set.dto';
import { PRISMA_PROVIDER } from './prisma.provider';

export interface SetLogResult {
  estimatedOneRepMax: number;
  setType: 'working' | 'warmup';
  rating?: number;
  delta?: number;
  percentile?: number;
  dots?: number;
  rankScore?: number;
  badgeRank?: string;
  badgeColor?: string;
  currentFormRank?: string;
  currentFormColor?: string;
  badgeProgressToNextRank?: number;
  currentFormProgress?: number;
  nextRankBoundary?: number;
  peakDots?: number;
  rollingAverageDots?: number;
  frankScore?: number;
  peakFrankScore?: number;
  currentFrankScore?: number;
  liftMultipliers?: Record<string, number>;
}

const PLATEAU_TIPS = [
  'Add 2.5kg or 2 reps',
  'Increase RPE by 1',
  'Add 1 extra set',
  'Deload week (50% weight)',
];

@Injectable()
export class SetsService {
  constructor(
    private readonly rmCalcService: RmCalcService,
    private readonly rankingService: RankingService,
    @Inject(PRISMA_PROVIDER)
    private readonly prisma: {
      saveSetLog: (input: any) => Promise<any>;
      saveRatingHistory: (input: any) => Promise<any>;
      countLogs: (userId: string, exercise: string) => Promise<number>;
      getRatingHistoryByExercise: (userId: string, exercise: string) => Promise<any[]>;
      findUserProfile: (userId: string) => Promise<any>;
      getLatestRatingsForUser: (userId: string) => Promise<any[]>;
      getSetLogHistory: (userId: string, exercise?: string) => Promise<any[]>;
      getRecentRatingHistory: (userId: string, exercise: string, take: number) => Promise<any[]>;
      updateHiddenExercises: (userId: string, hiddenExercises: string[]) => Promise<{ hiddenExercises: string[] }>;
    },
  ) {}

  async logSet(userId: string, input: LogSetDto): Promise<SetLogResult> {
    if (!userId) {
      throw new BadRequestError('userId is required from authentication layer');
    }
    const profile = await this.prisma.findUserProfile(userId);
    if (!profile) {
      throw new BadRequestError('User profile data mismatch or not found');
    }

    const setType = input.setType ?? 'working';
    const rmResult = this.rmCalcService.calculateOneRepMax(input.weight, input.reps);

    if (setType === 'warmup') {
      await this.prisma.saveSetLog({
        userId: userId,
        exercise: input.exercise,
        weight: input.weight,
        reps: input.reps,
        rpe: input.rpe ?? 10,
        setType: 'warmup',
        estimatedOneRepMax: rmResult.estimate,
      });

      return {
        estimatedOneRepMax: rmResult.estimate,
        setType: 'warmup',
      };
    }

    const exerciseSessionCount = await this.prisma.countLogs(userId, input.exercise);

    const rankingResult = this.rankingService.calculateRating(
      {
        weight: input.weight,
        reps: input.reps,
        sex: profile.sex as any,
        bodyweightLbs: profile.bodyweightLbs,
        exercise: input.exercise,
        rpe: (input as any).rpe,
      },
      exerciseSessionCount,
    );

    let finalFrankScore = rankingResult.frankScore;
    let finalBadgeRank = rankingResult.badgeRank;
    let finalBadgeColor = rankingResult.badgeColor;
    let finalFormProgress = rankingResult.badgeProgressToNextRank;

    if (exerciseSessionCount < 4) {
      finalBadgeRank = `Placement [${exerciseSessionCount + 1}/5]`;
      finalFormProgress = 0;
    } else if (exerciseSessionCount === 4) {
      const historicalLogs = await this.prisma.getRatingHistoryByExercise(userId, input.exercise);
      const sumOfPriorScores = historicalLogs.reduce((sum: number, log: any) => sum + (log.rating || 0), 0);
      const averagedEloScore = (sumOfPriorScores + rankingResult.frankScore) / 5;

      finalFrankScore = Number(averagedEloScore.toFixed(1));

      finalBadgeRank = this.rankingService.determineRankTierFromScore(input.exercise, finalFrankScore);
      finalBadgeColor = this.rankingService.getRankData(input.exercise, finalFrankScore).color;
      finalFormProgress = rankingResult.badgeProgressToNextRank;
    }

    await this.prisma.saveSetLog({
      userId: userId,
      exercise: input.exercise,
      weight: input.weight,
      reps: input.reps,
      rpe: input.rpe ?? 10,
      setType: 'working',
      estimatedOneRepMax: rmResult.estimate,
    });

    await this.prisma.saveRatingHistory({
      userId: userId,
      exercise: input.exercise,
      rating: finalFrankScore,
      isPlaced: exerciseSessionCount >= 4,
    });

    return {
      estimatedOneRepMax: rmResult.estimate,
      setType: 'working',
      rating: rankingResult.rating,
      delta: rankingResult.delta,
      percentile: rankingResult.percentile,
      dots: rankingResult.dots,
      rankScore: rankingResult.rankScore,
      badgeRank: finalBadgeRank,
      badgeColor: finalBadgeColor,
      currentFormRank: finalBadgeRank,
      currentFormColor: finalBadgeColor,
      badgeProgressToNextRank: finalFormProgress,
      currentFormProgress: finalFormProgress,
      nextRankBoundary: rankingResult.nextRankBoundary,
      peakDots: rankingResult.peakDots,
      rollingAverageDots: rankingResult.rollingAverageDots,
      frankScore: finalFrankScore,
      peakFrankScore: rankingResult.peakFrankScore,
      currentFrankScore: rankingResult.currentFrankScore,
      liftMultipliers: rankingResult.liftMultipliers,
    };
  }

  async getDashboard(userId: string) {
    if (!userId) {
      throw new BadRequestError('userId is required from authentication layer');
    }

    const profile = await this.prisma.findUserProfile(userId);
    const hiddenExercises = new Set<string>(profile?.hiddenExercises ?? []);

    const latestRatings = await this.prisma.getLatestRatingsForUser(userId);
    const latestByExercise = new Map(latestRatings.map((r: any) => [r.exercise, r]));

    const exercises = await Promise.all(
      EXERCISE_KEYS.map(async (exercise) => {
        const config = getExerciseConfig(exercise);
        const latest = latestByExercise.get(exercise);

        if (latest && latest.isPlaced) {
          const rankData = this.rankingService.getRankData(exercise, latest.rating);
          const plateau = await this.checkPlateau(userId, exercise);
          return {
            exercise,
            displayName: config.displayName,
            rank: rankData.rank,
            tier: rankData.tier,
            label: rankData.label,
            color: rankData.color,
            score: latest.rating,
            progress: rankData.progressToNextRank,
            isPlaced: true,
            isPlateaued: plateau.isPlateaued,
            plateauTips: plateau.tips,
          };
        }

        const sessionCount = await this.prisma.countLogs(userId, exercise);
        return {
          exercise,
          displayName: config.displayName,
          rank: null,
          tier: null,
          label: `Placement [${sessionCount}/5]`,
          color: this.rankingService.getPlacementColor(),
          score: latest?.rating ?? 0,
          progress: 0,
          isPlaced: false,
          isPlateaued: false,
          plateauTips: [] as string[],
        };
      }),
    );

    // Overall rank reflects true progress across every exercise, including hidden ones -
    // hiding only affects what renders on the dashboard, not what counts toward scoring.
    const overall = this.rankingService.getOverallRankData(
      Object.fromEntries(exercises.map((e) => [e.exercise, { score: e.score, isPlaced: e.isPlaced }])),
    );

    const visibleExercises = exercises.filter((e) => !hiddenExercises.has(e.exercise));

    return { exercises: visibleExercises, overall };
  }

  async getHistory(userId: string, exercise?: string) {
    if (!userId) {
      throw new BadRequestError('userId is required from authentication layer');
    }

    const logs = await this.prisma.getSetLogHistory(userId, exercise);
    return {
      logs: logs.map((log: any) => ({
        exercise: log.exercise,
        weight: log.weight,
        reps: log.reps,
        setType: log.setType,
        estimatedOneRepMax: log.estimatedOneRepMax,
        createdAt: log.createdAt,
      })),
    };
  }

  async updateHiddenExercises(userId: string, hiddenExercises: string[]): Promise<{ hiddenExercises: string[] }> {
    if (!userId) {
      throw new BadRequestError('userId is required from authentication layer');
    }

    const normalized = hiddenExercises.map((exercise) => exercise.toLowerCase());
    for (const exercise of normalized) {
      if (!EXERCISE_KEYS.includes(exercise)) {
        throw new BadRequestError(`unsupported exercise: ${exercise}`);
      }
    }

    return this.prisma.updateHiddenExercises(userId, normalized);
  }

  // Plateau = no new PR across the last 3 working sessions, with at least one prior
  // session establishing the PR being chased (so we need 4+ sessions to even evaluate).
  private async checkPlateau(userId: string, exercise: string): Promise<{ isPlateaued: boolean; tips: string[] }> {
    const rows = await this.prisma.getRecentRatingHistory(userId, exercise, 10);
    if (rows.length < 4) {
      return { isPlateaued: false, tips: [] };
    }

    const lastThree = rows.slice(0, 3);
    const priorBest = Math.max(...rows.slice(3).map((r: any) => r.rating));
    const isPlateaued = lastThree.every((r: any) => r.rating <= priorBest);

    return { isPlateaued, tips: isPlateaued ? PLATEAU_TIPS : [] };
  }
}
