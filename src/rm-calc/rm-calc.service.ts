import { BadRequestError } from '../errors';

export class RmCalcService {
  calculateOneRepMax(weight: number, reps: number): {
    estimate: number;
    method: 'direct' | 'average';
    confidence: 'exact' | 'high' | 'moderate';
  } {
    if (!Number.isFinite(weight) || !Number.isFinite(reps) || weight <= 0 || reps <= 0) {
      throw new BadRequestError('weight and reps must be positive');
    }

    if (reps === 1) {
      return {
        estimate: Number(weight.toFixed(1)),
        method: 'direct',
        confidence: 'exact',
      };
    }

    if (reps > 12) {
      throw new BadRequestError('unreliable estimates, log a heavier set');
    }

    const epley = weight * (1 + reps / 30);
    const brzycki = weight * (36 / (37 - reps));
    const estimate = Number(((epley + brzycki) / 2).toFixed(1));

    return {
      estimate,
      method: 'average',
      confidence: reps <= 6 ? 'high' : 'moderate',
    };
  }
}
