import { BadRequestError } from '../errors';

export type ExerciseCategory = 'compound' | 'accessory';

export interface ExerciseCutoffs {
  stoneI: number;
  ironI: number;
  bronzeI: number;
  silverI: number;
  goldI: number;
  diamondI: number;
}

export interface ExerciseConfig {
  key: string;
  displayName: string;
  category: ExerciseCategory;
  cutoffs: ExerciseCutoffs;
  // compound-only
  worldRecordDots?: { male: number; female: number };
  populationDistribution?: { male: { mean: number; stdDev: number }; female: { mean: number; stdDev: number } };
  // accessory-only
  baseline?: number;
}

export const EXERCISES: ExerciseConfig[] = [
  {
    key: 'squat',
    displayName: 'Squat',
    category: 'compound',
    cutoffs: { stoneI: 500, ironI: 1800, bronzeI: 3000, silverI: 4200, goldI: 5400, diamondI: 7800 },
    worldRecordDots: { male: 600, female: 540 },
    populationDistribution: { male: { mean: 125, stdDev: 35 }, female: { mean: 110, stdDev: 30 } },
  },
  {
    key: 'bench press',
    displayName: 'Bench',
    category: 'compound',
    cutoffs: { stoneI: 100, ironI: 1000, bronzeI: 2200, silverI: 3400, goldI: 4600, diamondI: 7000 },
    worldRecordDots: { male: 600, female: 540 },
    populationDistribution: { male: { mean: 120, stdDev: 32 }, female: { mean: 105, stdDev: 28 } },
  },
  {
    key: 'deadlift',
    displayName: 'Deadlift',
    category: 'compound',
    cutoffs: { stoneI: 1000, ironI: 2400, bronzeI: 3600, silverI: 4800, goldI: 6000, diamondI: 8400 },
    worldRecordDots: { male: 640, female: 580 },
    populationDistribution: { male: { mean: 140, stdDev: 38 }, female: { mean: 125, stdDev: 33 } },
  },
  {
    key: 'shoulder press',
    displayName: 'Shoulder',
    category: 'accessory',
    cutoffs: { stoneI: 25, ironI: 300, bronzeI: 1400, silverI: 2600, goldI: 3800, diamondI: 6200 },
    baseline: 300,
  },
  {
    key: 'lat pulldown',
    displayName: 'Lat Pull',
    category: 'accessory',
    cutoffs: { stoneI: 10, ironI: 100, bronzeI: 800, silverI: 2000, goldI: 3200, diamondI: 5600 },
    baseline: 430,
  },
  {
    key: 'bicep curl',
    displayName: 'Curl',
    category: 'accessory',
    cutoffs: { stoneI: 1, ironI: 25, bronzeI: 200, silverI: 1200, goldI: 2400, diamondI: 4800 },
    baseline: 200,
  },
];

export const EXERCISE_KEYS = EXERCISES.map((exercise) => exercise.key);

export function getExerciseConfig(key: string): ExerciseConfig {
  const config = EXERCISES.find((exercise) => exercise.key === key.toLowerCase());
  if (!config) {
    throw new BadRequestError('unsupported exercise');
  }
  return config;
}
