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
    expect(() => service.calculateRating({ weight: 0, reps: 5, sex: 'male', bodyweightLbs: 176, exercise: 'squat' })).toThrow(BadRequestError);
    expect(() => service.calculateRating({ weight: 100, reps: 0, sex: 'male', bodyweightLbs: 176, exercise: 'bench press' })).toThrow(BadRequestError);
    expect(() => service.calculateRating({ weight: 100, reps: 13, sex: 'male', bodyweightLbs: 176, exercise: 'deadlift' })).toThrow(BadRequestError);
  });

  it('rejects completely unsupported exercise names', () => {
    expect(() => service.calculateRating({
      weight:100,
      reps: 5,
      sex: 'male',
      bodyweightLbs: 176,
      exercise: 'swimming' as any
    })).toThrow(BadRequestError);
  })

  it('processes compound lifts using core DOTS curve algo when placed', () => {
    const result = service.calculateRating({
      exercise: 'squat',
      weight: 225,
      reps: 5,
      sex: 'male',
      bodyweightLbs: 182,
    }, 5);

    expect(result.rankScore).toBeGreaterThan(0);
    expect(result.badgeRank).toBe('Bronze II');
    expect(result.badgeColor).toBe('#d97706');
    expect(result.dots).toBeGreaterThan(0);
  });

  it('processes accessory lifts based on RPE intensity maps', () => {
    const rpePayload = service.calculateRating({
      exercise: 'bicep curl',
      weight: 40,
      reps: 8,
      rpe: 9,
      sex: 'male',
      bodyweightLbs: 182,
     }, 5);

    expect(rpePayload.frankScore).toBeGreaterThan(0);
    expect(rpePayload.dots).toBeDefined();
    expect(rpePayload.badgeRank).toBe('Gold I');
  });

  it('keeps a strong-but-not-superhuman accessory lift out of Diamond', () => {
    const result = service.calculateRating({
      exercise: 'bicep curl',
      weight: 90,
      reps: 6,
      rpe: 10,
      sex: 'male',
      bodyweightLbs: 182,
    }, 5);

    expect(result.badgeRank).toBe('Platinum I');
  });

  it('exposes public tier translation utilities for backend calcs', () => {
    const ironTier = service.determineRankTierFromScore('squat', 1500);
    const diamondTier = service.determineRankTierFromScore('squat', 9000);

    expect(ironTier).toBe('Iron');
    expect(diamondTier).toBe('Diamond');
  });

  describe('getRankData boundary contiguity', () => {
    it('treats each spec cutoff as the floor of the next rank up (squat)', () => {
      expect(service.getRankData('squat', 500).rank).toBe('Iron');
      expect(service.getRankData('squat', 499).rank).toBe('Stone');
      expect(service.getRankData('squat', 1800).rank).toBe('Bronze');
      expect(service.getRankData('squat', 5400).label).toBe('Platinum III');
      expect(service.getRankData('squat', 7800).label).toBe('Diamond III');
    });

    it('has no upper cap on Diamond', () => {
      expect(service.getRankData('squat', 50000).rank).toBe('Diamond');
    });
  });

  describe('getOverallRankData', () => {
    it('reports Unranked when no exercise is placed yet', () => {
      const overall = service.getOverallRankData({
        squat: { score: 0, isPlaced: false },
      });

      expect(overall.rank).toBe('Unranked');
    });

    it('averages placed exercises using each exercise\'s own Diamond-I cutoff', () => {
      const overall = service.getOverallRankData({
        squat: { score: 3900, isPlaced: true }, // 50% of squat's 7800 Diamond I
        deadlift: { score: 4200, isPlaced: true }, // 50% of deadlift's 8400 Diamond I
      });

      // Average % progress is 50%, which falls in the Silver band (45-59%)
      expect(overall.rank).toBe('Silver');
    });
  });
});
