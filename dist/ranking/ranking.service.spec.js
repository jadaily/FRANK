"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../errors");
const ranking_service_1 = require("./ranking.service");
describe('RankingService', () => {
    let service;
    beforeEach(() => {
        service = new ranking_service_1.RankingService();
    });
    it('rejects invalid inputs', () => {
        expect(() => service.calculateRating({ weight: 0, reps: 5, sex: 'male', bodyweightKg: 80, exercise: 'squat' })).toThrow(errors_1.BadRequestError);
        expect(() => service.calculateRating({ weight: 100, reps: 0, sex: 'male', bodyweightKg: 80, exercise: 'bench press' })).toThrow(errors_1.BadRequestError);
        expect(() => service.calculateRating({ weight: 100, reps: 13, sex: 'male', bodyweightKg: 80, exercise: 'deadlift' })).toThrow(errors_1.BadRequestError);
    });
    it('returns a rank-based result for a standard squat sample', () => {
        const result = service.calculateRating({ weight: 225, reps: 5, sex: 'male', bodyweightKg: 82.5, exercise: 'squat' });
        expect(result.rankScore).toBeGreaterThan(0);
        expect(result.badgeRank).toBe('Gold');
        expect(result.badgeProgressToNextRank).toBeGreaterThan(0);
        expect(result.delta).toBeGreaterThanOrEqual(0);
    });
    it('keeps the rating non-decreasing for a stronger lift', () => {
        const lower = service.calculateRating({ weight: 200, reps: 5, sex: 'male', bodyweightKg: 80, exercise: 'bench press' });
        const higher = service.calculateRating({ weight: 220, reps: 5, sex: 'male', bodyweightKg: 80, exercise: 'bench press' });
        expect(higher.rating).toBeGreaterThanOrEqual(lower.rating);
    });
});
