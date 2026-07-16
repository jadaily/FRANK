import { BadRequestError } from '../errors';
import { RmCalcService } from './rm-calc.service';

describe('RmCalcService', () => {
  let service: RmCalcService;

  beforeEach(() => {
    service = new RmCalcService();
  });

  it('rejects invalid inputs', () => {
    expect(() => service.calculateOneRepMax(0, 5)).toThrow(BadRequestError);
    expect(() => service.calculateOneRepMax(100, 0)).toThrow(BadRequestError);
    expect(() => service.calculateOneRepMax(100, 13)).toThrow(BadRequestError);
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
