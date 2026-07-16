"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../errors");
const rm_calc_service_1 = require("./rm-calc.service");
describe('RmCalcService', () => {
    let service;
    beforeEach(() => {
        service = new rm_calc_service_1.RmCalcService();
    });
    it('rejects invalid inputs', () => {
        expect(() => service.calculateOneRepMax(0, 5)).toThrow(errors_1.BadRequestError);
        expect(() => service.calculateOneRepMax(100, 0)).toThrow(errors_1.BadRequestError);
        expect(() => service.calculateOneRepMax(100, 13)).toThrow(errors_1.BadRequestError);
    });
    it('returns the weight directly for a single rep', () => {
        const result = service.calculateOneRepMax(225, 1);
        expect(result).toEqual({
            estimate: 225,
            method: 'direct',
            confidence: 'exact',
        });
    });
    it('matches the regression value for a common 225x5 case', () => {
        const result = service.calculateOneRepMax(225, 5);
        expect(result.estimate).toBe(257.8);
        expect(result.method).toBe('average');
        expect(result.confidence).toBe('high');
    });
    it('stays monotonic for heavier sets with the same reps', () => {
        const lighter = service.calculateOneRepMax(200, 5);
        const heavier = service.calculateOneRepMax(225, 5);
        expect(heavier.estimate).toBeGreaterThan(lighter.estimate);
    });
});
