import { IsIn, IsNumber, Min } from 'class-validator';

export class LogSetDto {
  
  @IsIn(['squat', 'bench press', 'deadlift'])
  exercise!: 'squat' | 'bench press' | 'deadlift';

  @IsNumber()
  @Min(1)
  weight!: number;

  @IsNumber()
  @Min(1)
  reps!: number;

  @IsIn(['male', 'female'])
  sex!: 'male' | 'female';

  @IsNumber()
  @Min(1)
  bodyweightKg!: number;
}
