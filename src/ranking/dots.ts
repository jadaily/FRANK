import { BadRequestError } from '../errors';

export type Sex = 'male' | 'female';
export type Lift = 'squat' | 'bench press' | 'deadlift';

export interface RatingInput {
  weight: number;
  reps: number;
  sex: Sex;
  bodyweightKg: number;
  exercise: Lift;
}

export interface RatingResult {
  rating: number;
  delta: number;
  percentile: number;
  dots: number;
  opponentRating: number;
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

export function calculateDots(weightKg: number, bodyweightKg: number, sex: Sex): number {
  if (bodyweightKg <= 0) {
    throw new BadRequestError('bodyweight must be positive');
  }

  const sexFactor = sex === 'male' ? 1 : 0.92;
  const ratio = weightKg / bodyweightKg;
  return Number((ratio * 100 * sexFactor).toFixed(1));
}
