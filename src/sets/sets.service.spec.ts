import { RmCalcService } from '../rm-calc/rm-calc.service';
import { RankingService } from '../ranking/ranking.service';
import { SetsService } from './sets.service';

describe('SetsService', () => {
  let service: SetsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      countLogs: jest.fn().mockResolvedValue(0),
      findUserProfile: jest.fn().mockResolvedValue({
        sex: 'male',
        bodyweightLbs: 182,
        hiddenExercises: [],
      }),
      getRatingHistoryByExercise: jest.fn().mockResolvedValue([
        { rating: 2200 },
        { rating: 2300 },
        { rating: 2100 },
        { rating: 2400 },
      ]),
      getLatestRatingsForUser: jest.fn().mockResolvedValue([]),
      getSetLogHistory: jest.fn().mockResolvedValue([]),
      getRecentRatingHistory: jest.fn().mockResolvedValue([]),
      updateHiddenExercises: jest.fn().mockImplementation((_userId: string, hiddenExercises: string[]) => Promise.resolve({ hiddenExercises })),
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
    });

    expect(result.badgeRank).not.toContain('Placement');
    expect(result.badgeRank).toBeDefined();
    expect(mockPrisma.getRatingHistoryByExercise).toHaveBeenCalledWith('user-1', 'squat');
  });

  it('logs warm-up sets without touching scoring, placement, or PR history', async () => {
    const result = await service.logSet('user-1', {
      exercise: 'squat',
      weight: 135,
      reps: 8,
      setType: 'warmup',
    } as any);

    expect(result.setType).toBe('warmup');
    expect(result.badgeRank).toBeUndefined();
    expect(result.frankScore).toBeUndefined();
    expect(mockPrisma.saveSetLog).toHaveBeenCalledWith(expect.objectContaining({ setType: 'warmup' }));
    expect(mockPrisma.saveRatingHistory).not.toHaveBeenCalled();
    expect(mockPrisma.countLogs).not.toHaveBeenCalled();
  });

  it('tags working sets with setType when saving', async () => {
    await service.logSet('user-1', {
      exercise: 'squat',
      weight: 225,
      reps: 5,
    });

    expect(mockPrisma.saveSetLog).toHaveBeenCalledWith(expect.objectContaining({ setType: 'working' }));
  });

  it('builds a dashboard combining per-exercise ranks with an overall rank', async () => {
    mockPrisma.getLatestRatingsForUser.mockResolvedValue([
      { exercise: 'squat', rating: 3900, isPlaced: true },
      { exercise: 'deadlift', rating: 4200, isPlaced: true },
    ]);
    mockPrisma.countLogs.mockResolvedValue(2);

    const dashboard = await service.getDashboard('user-1');

    const squatEntry = dashboard.exercises.find((e: any) => e.exercise === 'squat')!;
    expect(squatEntry.isPlaced).toBe(true);
    expect(squatEntry.label).toBe('Silver I');
    expect(squatEntry.displayName).toBe('Squat');

    const bicepEntry = dashboard.exercises.find((e: any) => e.exercise === 'bicep curl')!;
    expect(bicepEntry.isPlaced).toBe(false);
    expect(bicepEntry.label).toBe('Placement [2/5]');

    expect(dashboard.overall.rank).toBe('Silver');
  });

  it('omits hidden exercises from the dashboard but still counts them toward overall rank', async () => {
    mockPrisma.findUserProfile.mockResolvedValue({
      sex: 'male',
      bodyweightLbs: 182,
      hiddenExercises: ['deadlift'],
    });
    mockPrisma.getLatestRatingsForUser.mockResolvedValue([
      { exercise: 'squat', rating: 3900, isPlaced: true },
      { exercise: 'deadlift', rating: 4200, isPlaced: true },
    ]);

    const dashboard = await service.getDashboard('user-1');

    expect(dashboard.exercises.find((e: any) => e.exercise === 'deadlift')).toBeUndefined();
    expect(dashboard.exercises.find((e: any) => e.exercise === 'squat')).toBeDefined();
    // Overall still reflects deadlift's score even though its card is hidden.
    expect(dashboard.overall.rank).toBe('Silver');
  });

  it('flags a plateaued exercise with tips when the last 3 sessions failed to beat the PR', async () => {
    mockPrisma.getLatestRatingsForUser.mockResolvedValue([
      { exercise: 'squat', rating: 2360, isPlaced: true },
    ]);
    mockPrisma.getRecentRatingHistory.mockImplementation((_userId: string, exercise: string) => {
      if (exercise !== 'squat') return Promise.resolve([]);
      return Promise.resolve([
        { rating: 2300 }, // most recent
        { rating: 2280 },
        { rating: 2350 },
        { rating: 2360 }, // the PR, 4th most recent
        { rating: 2000 },
      ]);
    });

    const dashboard = await service.getDashboard('user-1');
    const squatEntry = dashboard.exercises.find((e: any) => e.exercise === 'squat')!;

    expect(squatEntry.isPlateaued).toBe(true);
    expect(squatEntry.plateauTips).toEqual([
      'Add 2.5kg or 2 reps',
      'Increase RPE by 1',
      'Add 1 extra set',
      'Deload week (50% weight)',
    ]);
  });

  it('does not flag a plateau when a recent session set a new PR', async () => {
    mockPrisma.getLatestRatingsForUser.mockResolvedValue([
      { exercise: 'squat', rating: 2500, isPlaced: true },
    ]);
    mockPrisma.getRecentRatingHistory.mockImplementation((_userId: string, exercise: string) => {
      if (exercise !== 'squat') return Promise.resolve([]);
      return Promise.resolve([
        { rating: 2500 }, // new PR, most recent
        { rating: 2280 },
        { rating: 2350 },
        { rating: 2360 },
      ]);
    });

    const dashboard = await service.getDashboard('user-1');
    const squatEntry = dashboard.exercises.find((e: any) => e.exercise === 'squat')!;

    expect(squatEntry.isPlateaued).toBe(false);
    expect(squatEntry.plateauTips).toEqual([]);
  });

  it('returns set log history mapped to display fields', async () => {
    mockPrisma.getSetLogHistory.mockResolvedValue([
      { exercise: 'squat', weight: 225, reps: 5, setType: 'working', estimatedOneRepMax: 257.8, createdAt: new Date('2026-07-01') },
    ]);

    const history = await service.getHistory('user-1', 'squat');

    expect(mockPrisma.getSetLogHistory).toHaveBeenCalledWith('user-1', 'squat');
    expect(history.logs).toHaveLength(1);
    expect(history.logs[0]).toMatchObject({ exercise: 'squat', weight: 225, reps: 5, estimatedOneRepMax: 257.8, setType: 'working' });
  });

  describe('updateHiddenExercises', () => {
    it('persists a valid list of exercise keys', async () => {
      const result = await service.updateHiddenExercises('user-1', ['deadlift', 'BICEP CURL']);

      expect(mockPrisma.updateHiddenExercises).toHaveBeenCalledWith('user-1', ['deadlift', 'bicep curl']);
      expect(result.hiddenExercises).toEqual(['deadlift', 'bicep curl']);
    });

    it('rejects an unsupported exercise key', async () => {
      await expect(service.updateHiddenExercises('user-1', ['rowing'])).rejects.toThrow('unsupported exercise');
    });
  });
});
