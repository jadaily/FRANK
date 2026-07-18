import { RmCalcService } from '../rm-calc/rm-calc.service';
import { RankingService } from '../ranking/ranking.service';
import { SetsService } from './sets.service';

describe('SetsService', () => {
  let service: SetsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      countLogs: jest.fn().mockResolvedValue(0),
      getRatingHistoryByExercise: jest.fn().mockResolvedValue([
        { rating: 2200 },
        { rating: 2300 },
        { rating: 2100 },
        { rating: 2400 },
      ]),
      saveSetLog: jest.fn().mockResolvedValue({ id: 1}),
      saveRatingHistory: jest.fn().mockResolvedValue({ id: 1}),
    };

    const rmCalcService = new RmCalcService();
    const rankingService = new RankingService(rmCalcService);
    service = new SetsService(rmCalcService, rankingService, mockPrisma);
  });

  it('handles placement matches cleanly during the first 4 sets', async () => {
    mockPrisma.countLogs.mockResolvedValue(2);

    const result = await service.logSet('user-1', {
      exercise: 'squat',
      weight: 225,
      reps: 5,
      sex: 'male',
      bodyweightKg: 82.5,
    });

    expect(result.badgeRank).toBe('Placement [3/5]');
    expect(result.badgeProgressToNextRank).toBe(0);
    expect(mockPrisma.saveSetLog).toHaveBeenCalledTimes(1);
  });

  it('unlocks an averaged placement tier at exactly the 5th lift match entry', async () => {
    mockPrisma.countLogs.mockResolvedValue(4);
    
    const result = await service.logSet('user-1', {
      exercise: 'squat',
      weight: 225,
      reps: 5,
      sex: 'male',
      bodyweightKg: 82.5,
    });

    expect(result.badgeRank).not.toContain('Placement');
    expect(result.badgeRank).toBeDefined();
    expect(mockPrisma.getRatingHistoryByExercise).toHaveBeenCalledWith('user-1', 'squat');
  });
});