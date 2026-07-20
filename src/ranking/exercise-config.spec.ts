import { BadRequestError } from '../errors';
import { EXERCISES, EXERCISE_KEYS, getExerciseConfig } from './exercise-config';

describe('exercise-config registry', () => {
  it('exposes one key per registered exercise', () => {
    expect(EXERCISE_KEYS).toEqual(EXERCISES.map((exercise) => exercise.key));
  });

  it('looks up a known exercise case-insensitively', () => {
    expect(getExerciseConfig('SQUAT').displayName).toBe('Squat');
  });

  it('throws for an unknown exercise', () => {
    expect(() => getExerciseConfig('rowing')).toThrow(BadRequestError);
  });

  it('gives every compound exercise the fields calculateRating needs', () => {
    const compounds = EXERCISES.filter((exercise) => exercise.category === 'compound');
    expect(compounds.length).toBeGreaterThan(0);
    compounds.forEach((exercise) => {
      expect(exercise.worldRecordDots).toBeDefined();
      expect(exercise.populationDistribution).toBeDefined();
    });
  });

  it('gives every accessory exercise a baseline', () => {
    const accessories = EXERCISES.filter((exercise) => exercise.category === 'accessory');
    expect(accessories.length).toBeGreaterThan(0);
    accessories.forEach((exercise) => {
      expect(exercise.baseline).toBeGreaterThan(0);
    });
  });
});
