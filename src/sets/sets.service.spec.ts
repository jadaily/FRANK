import { RmCalcService } from '../rm-calc/rm-calc.service';
import { RankingService } from '../ranking/ranking.service';
import { SetsService } from './sets.service';

describe('SetsService', () => {
  it('logs a set and returns RM and rating updates', async () => {
    const prisma = {
      saveSetLog: jest.fn(async () => ({ id: 1 })),
      saveRatingHistory: jest.fn(async () => ({ id: 1 })),
    };

    const rmCalcService = new RmCalcService();
    const rankingService = new RankingService(rmCalcService);

    const service = new SetsService(
      rmCalcService,
      rankingService,
      prisma as any,
    );

    const result = await service.logSet('user-1', {
      exercise: 'squat',
      weight: 225,
      reps: 5,
      sex: 'male',
      bodyweightKg: 82.5,
    });

    expect(result.estimatedOneRepMax).toBe(257.8);
    expect(result.rankScore).toBeGreaterThan(0);
    expect(result.badgeRank).toBeDefined();
    expect(result.badgeProgressToNextRank).toBeGreaterThan(0);
    expect(result.delta).toBeGreaterThan(0);
    expect(prisma.saveSetLog).toHaveBeenCalledTimes(1);
    expect(prisma.saveRatingHistory).toHaveBeenCalledTimes(1);

    expect(prisma.saveSetLog).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1' }));
    expect(prisma.saveRatingHistory).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1' }));
  });
});
