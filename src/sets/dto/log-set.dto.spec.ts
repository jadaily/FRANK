import { validate } from 'class-validator';
import { LogSetDto } from './log-set.dto';

describe('LogSetDto validation', () => {
  it('accepts a well-formed set payload', async () => {
    const dto = new LogSetDto();
    dto.exercise = 'squat';
    dto.weight = 225;
    dto.reps = 5;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts a well-formed accessory set payload w/ RPE', async () => {
    const dto = new LogSetDto();
    dto.exercise = 'bicep curl';
    dto.weight = 40;
    dto.reps = 8;
    dto.rpe = 9;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects invalid values', async () => {
    const dto = new LogSetDto();
    dto.exercise = 'rowing' as any;
    dto.weight = 0;
    dto.reps = 0;
    dto.rpe = 11;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
