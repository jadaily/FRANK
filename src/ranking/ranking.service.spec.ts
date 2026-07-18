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

  it('processes accessory lifts based on RPE intensity maps', () => {
    const rpePayload = service.calculateRating({ 
      exercise: 'bicep curl',
      weight: 40, 
      reps: 8, 
      rpe: 9,
      sex: 'male', 
      bodyweightKg: 82.5, 
     }, 5);
    
    expect(rpePayload.frankScore).toBeGreaterThan(0);
    expect(rpePayload.dots).toBeDefined();

  });

  it('exposes public tier translation utilities for backend calcs', () => {
    const initiateTier = service.determineRankTierFromScore(1500);
    const eliteTier = service.determineRankTierFromScore(9000);

    expect(initiateTier).toBe('Initiate');
    expect(eliteTier).toBe('Elite');
  });
});
