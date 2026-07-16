import { BadRequestError } from '../errors';
import { RmCalcService } from '../rm-calc/rm-calc.service';
import { RankingService } from './ranking.service';

describe('RankingService', () => {
  let service: RankingService;

  beforeEach(() => {
    const rmCalcService = new RmCalcService();
    service = new RankingService(rmCalcService);
  });

  it('rejects invalid inputs', () => {
    expect(() => service.calculateRating({ weight: 0, reps: 5, sex: 'male', bodyweightKg: 80, exercise: 'squat' })).toThrow(BadRequestError);
    expect(() => service.calculateRating({ weight: 100, reps: 0, sex: 'male', bodyweightKg: 80, exercise: 'bench press' })).toThrow(BadRequestError);
    expect(() => service.calculateRating({ weight: 100, reps: 13, sex: 'male', bodyweightKg: 80, exercise: 'deadlift' })).toThrow(BadRequestError);
  });

  it('returns a rank-based result for a standard squat sample', () => {
    const result = service.calculateRating({ weight: 225, reps: 5, sex: 'male', bodyweightKg: 82.5, exercise: 'squat' });

    expect(result.rankScore).toBeGreaterThan(0);
    
    expect(result.badgeRank).toBe('Initiate');
    expect(result.badgeProgressToNextRank).toBeGreaterThan(0);
    expect(result.delta).toBeGreaterThanOrEqual(0);
  });

  it('keeps the rating non-decreasing for a stronger lift', () => {
    const lower = service.calculateRating({ weight: 200, reps: 5, sex: 'male', bodyweightKg: 80, exercise: 'bench press' });
    const higher = service.calculateRating({ weight: 220, reps: 5, sex: 'male', bodyweightKg: 80, exercise: 'bench press' });

    expect(higher.rating).toBeGreaterThanOrEqual(lower.rating);
  });
});
