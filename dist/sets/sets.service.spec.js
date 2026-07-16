"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rm_calc_service_1 = require("../rm-calc/rm-calc.service");
const ranking_service_1 = require("../ranking/ranking.service");
const sets_service_1 = require("./sets.service");
describe('SetsService', () => {
    it('logs a set and returns RM and rating updates', async () => {
        const prisma = {
            saveSetLog: jest.fn(async () => ({ id: 1 })),
            saveRatingHistory: jest.fn(async () => ({ id: 1 })),
        };
        const service = new sets_service_1.SetsService(new rm_calc_service_1.RmCalcService(), new ranking_service_1.RankingService(), prisma);
        const result = await service.logSet({
            userId: 'user-1',
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
    });
});
